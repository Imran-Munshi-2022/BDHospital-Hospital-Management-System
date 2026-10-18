import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  isRecordNotFound,
  parseIdParam,
  readJsonBody,
  stripUndefined,
  zodErrorMessage,
} from "@/lib/validation";
const APPOINTMENT_STATUSES = ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const appointmentInclude = {
  doctor: {
    select: {
      id: true,
      fullName: true,
      photo: true,
      designation: true,
      specialty: { select: { name: true } },
    },
  },
  patient: { select: { id: true, fullName: true, gender: true, age: true, bloodGroup: true } },
};

const updateAppointmentSchema = z.object({
  doctorId: z.coerce.number().int().positive().optional(),
  patientId: z.coerce.number().int().positive().optional(),
  date: z.string().regex(DATE_PATTERN, "date must be in YYYY-MM-DD format").optional(),
  timeSlot: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
  notes: z.string().nullish(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/appointments/[id]
export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
    }

    const appointment = await db.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("GET /api/appointments/[id] failed:", error);
    return NextResponse.json({ error: "Failed to load appointment" }, { status: 500 });
  }
}

// PATCH /api/appointments/[id] — {status} and/or field edits
export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
    }

    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = updateAppointmentSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = stripUndefined(parsed.data);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    const current = await db.appointment.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (data.doctorId !== undefined) {
      const doctor = await db.doctor.findUnique({ where: { id: data.doctorId } });
      if (!doctor) {
        return NextResponse.json({ error: "Doctor not found" }, { status: 400 });
      }
    }
    if (data.patientId !== undefined) {
      const patient = await db.patient.findUnique({ where: { id: data.patientId } });
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 400 });
      }
    }

    // Re-check double booking when the doctor/date/timeSlot combination changes.
    if (data.doctorId !== undefined || data.date !== undefined || data.timeSlot !== undefined) {
      const doctorId = data.doctorId ?? current.doctorId;
      const date = data.date ?? current.date;
      const timeSlot = data.timeSlot ?? current.timeSlot;
      const conflict = await db.appointment.findFirst({
        where: {
          doctorId,
          date,
          timeSlot,
          status: { not: "CANCELLED" },
          id: { not: id },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Doctor already has an appointment at this time" },
          { status: 409 }
        );
      }
    }

    const appointment = await db.appointment.update({
      where: { id },
      data,
      include: appointmentInclude,
    });
    return NextResponse.json({ appointment });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    console.error("PATCH /api/appointments/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

// DELETE /api/appointments/[id]
export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
    }

    await db.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    console.error("DELETE /api/appointments/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}
