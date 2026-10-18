import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  isRecordNotFound,
  isUniqueViolation,
  parseIdParam,
  readJsonBody,
  stripUndefined,
  zodErrorMessage,
} from "@/lib/validation";

const doctorDetailInclude = {
  specialty: { select: { id: true, name: true, icon: true } },
  _count: { select: { appointments: true, reviews: true } },
} satisfies Prisma.DoctorInclude;

const updateDoctorSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.email().optional(),
  phone: z.string().min(1).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  designation: z.string().min(1).optional(),
  specialtyId: z.coerce.number().int().positive().optional(),
  bio: z.string().optional(),
  experienceYears: z.coerce.number().int().min(0).optional(),
  consultationFee: z.coerce.number().min(0).optional(),
  photo: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/doctors/[id] — doctor with specialty + counters
export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid doctor id" }, { status: 400 });
    }

    const doctor = await db.doctor.findUnique({ where: { id }, include: doctorDetailInclude });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (error) {
    console.error("GET /api/doctors/[id] failed:", error);
    return NextResponse.json({ error: "Failed to load doctor" }, { status: 500 });
  }
}

// PATCH /api/doctors/[id] — partial update
export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid doctor id" }, { status: 400 });
    }

    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = updateDoctorSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = stripUndefined(parsed.data);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    if (data.specialtyId !== undefined) {
      const specialty = await db.specialty.findUnique({ where: { id: data.specialtyId } });
      if (!specialty) {
        return NextResponse.json({ error: "Specialty not found" }, { status: 400 });
      }
    }

    if (data.email !== undefined) {
      const existing = await db.doctor.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "A doctor with this email already exists" },
          { status: 409 }
        );
      }
    }

    const doctor = await db.doctor.update({ where: { id }, data, include: doctorDetailInclude });
    return NextResponse.json({ doctor });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "A doctor with this email already exists" },
        { status: 409 }
      );
    }
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
    console.error("PATCH /api/doctors/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
  }
}

// DELETE /api/doctors/[id]
export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid doctor id" }, { status: 400 });
    }

    await db.doctor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
    console.error("DELETE /api/doctors/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete doctor" }, { status: 500 });
  }
}
