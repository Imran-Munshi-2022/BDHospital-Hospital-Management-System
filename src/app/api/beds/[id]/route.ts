import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  isRecordNotFound,
  parseIdParam,
  readJsonBody,
  zodErrorMessage,
} from "@/lib/validation";

const bedInclude = {
  patient: { select: { id: true, fullName: true, bloodGroup: true } },
};

const updateBedSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "CLEANING"], {
    message: "status must be AVAILABLE, OCCUPIED or CLEANING",
  }),
  patientId: z.coerce.number().int().positive().nullish(),
});

type RouteCtx = { params: Promise<{ id: string }> };

// PATCH /api/beds/[id] {status, patientId?}
// - OCCUPIED requires patientId (validated); AVAILABLE/CLEANING clears the patient.
export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid bed id" }, { status: 400 });
    }

    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = updateBedSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { status, patientId } = parsed.data;

    const bed = await db.bed.findUnique({ where: { id } });
    if (!bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    if (status === "OCCUPIED") {
      if (patientId == null) {
        return NextResponse.json(
          { error: "patientId is required when status is OCCUPIED" },
          { status: 400 }
        );
      }
      const patient = await db.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 400 });
      }
    }

    const updated = await db.bed.update({
      where: { id },
      data: {
        status,
        patientId: status === "OCCUPIED" ? (patientId ?? null) : null,
      },
      include: bedInclude,
    });

    return NextResponse.json({ bed: updated });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }
    console.error("PATCH /api/beds/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update bed" }, { status: 500 });
  }
}
