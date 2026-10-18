import { NextResponse } from "next/server";
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

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

const updatePatientSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.email().optional(),
  phone: z.string().min(1).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
  address: z.string().optional(),
  insuranceId: z.string().nullish(),
});

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/patients/[id]
export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid patient id" }, { status: 400 });
    }

    const patient = await db.patient.findUnique({ where: { id } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("GET /api/patients/[id] failed:", error);
    return NextResponse.json({ error: "Failed to load patient" }, { status: 500 });
  }
}

// PATCH /api/patients/[id] — partial update
export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid patient id" }, { status: 400 });
    }

    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = updatePatientSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = stripUndefined(parsed.data);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    if (data.email !== undefined) {
      const existing = await db.patient.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "A patient with this email already exists" },
          { status: 409 }
        );
      }
    }

    const patient = await db.patient.update({ where: { id }, data });
    return NextResponse.json({ patient });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "A patient with this email already exists" },
        { status: 409 }
      );
    }
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    console.error("PATCH /api/patients/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}

// DELETE /api/patients/[id]
export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid patient id" }, { status: 400 });
    }

    await db.patient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    console.error("DELETE /api/patients/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 });
  }
}
