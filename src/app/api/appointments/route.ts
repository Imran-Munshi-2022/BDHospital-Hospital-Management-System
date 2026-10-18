import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { readJsonBody, zodErrorMessage } from "@/lib/validation";

const APPOINTMENT_STATUSES = ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

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
} satisfies Prisma.AppointmentInclude;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const createAppointmentSchema = z.object({
  doctorId: z.coerce.number().int().positive("doctorId must be a positive integer"),
  patientId: z.coerce.number().int().positive("patientId must be a positive integer"),
  date: z.string().regex(DATE_PATTERN, "date must be in YYYY-MM-DD format"),
  timeSlot: z.string().min(1, "timeSlot is required"),
  reason: z.string().min(1, "reason is required"),
  notes: z.string().nullish(),
  status: z.enum(APPOINTMENT_STATUSES).default("SCHEDULED"),
});

// GET /api/appointments?status=&date=&doctorId=&patientId=
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const doctorIdParam = searchParams.get("doctorId");
    const patientIdParam = searchParams.get("patientId");

    const where: Prisma.AppointmentWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (date) {
      if (!DATE_PATTERN.test(date)) {
        return NextResponse.json(
          { error: "date must be in YYYY-MM-DD format" },
          { status: 400 }
        );
      }
      where.date = date;
    }
    if (doctorIdParam) {
      const doctorId = Number(doctorIdParam);
      if (!Number.isInteger(doctorId) || doctorId <= 0) {
        return NextResponse.json({ error: "doctorId must be a positive integer" }, { status: 400 });
      }
      where.doctorId = doctorId;
    }
    if (patientIdParam) {
      const patientId = Number(patientIdParam);
      if (!Number.isInteger(patientId) || patientId <= 0) {
        return NextResponse.json(
          { error: "patientId must be a positive integer" },
          { status: 400 }
        );
      }
      where.patientId = patientId;
    }

    const appointments = await db.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("GET /api/appointments failed:", error);
    return NextResponse.json({ error: "Failed to load appointments" }, { status: 500 });
  }
}

// POST /api/appointments — book (rejects double booking with 409)
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = createAppointmentSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;

    const doctor = await db.doctor.findUnique({ where: { id: data.doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 400 });
    }

    const patient = await db.patient.findUnique({ where: { id: data.patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 400 });
    }

    const conflict = await db.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        date: data.date,
        timeSlot: data.timeSlot,
        status: { not: "CANCELLED" },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Doctor already has an appointment at this time" },
        { status: 409 }
      );
    }

    const appointment = await db.appointment.create({
      data: { ...data, notes: data.notes ?? null },
      include: appointmentInclude,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/appointments failed:", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
