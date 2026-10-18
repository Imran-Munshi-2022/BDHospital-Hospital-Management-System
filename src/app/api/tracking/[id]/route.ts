import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  STAGES,
  generateVitals,
  parseHistory,
  stageIndex,
  shapeTrackingRecord,
  trackingInclude,
} from "@/lib/tracking";
import { parseIdParam, readJsonBody, zodErrorMessage } from "@/lib/validation";

const updateTrackingSchema = z.object({
  action: z.enum(["advance", "complete"], { message: "action must be 'advance' or 'complete'" }),
});

type RouteCtx = { params: Promise<{ id: string }> };

// PATCH /api/tracking/[id] {action: "advance" | "complete"}
export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid tracking record id" }, { status: 400 });
    }

    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = updateTrackingSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { action } = parsed.data;

    const record = await db.trackingRecord.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: "Tracking record not found" }, { status: 404 });
    }

    if (action === "advance") {
      if (record.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Tracking record is already completed" },
          { status: 400 }
        );
      }

      const now = new Date();
      const elapsedMin = Math.max(0, (now.getTime() - record.stageEnteredAt.getTime()) / 60000);

      // Close out the current stage with its actual duration...
      const history = parseHistory(record.history);
      history.push({
        stage: record.currentStage,
        enteredAt: record.stageEnteredAt.toISOString(),
        durationMin: Math.max(0, Math.round(elapsedMin)),
      });

      // ...and move to the next one (or finish the journey).
      const nextIdx = stageIndex(record.currentStage) + 1;
      const data: Prisma.TrackingRecordUpdateInput = {
        history: JSON.stringify(history),
        stageEnteredAt: now,
      };
      if (nextIdx >= STAGES.length) {
        data.status = "COMPLETED"; // past CHECKOUT
      } else {
        data.currentStage = STAGES[nextIdx];
        if (nextIdx === 1 && !record.vitals) {
          data.vitals = generateVitals(record.patientId); // entering TRIAGE
        }
      }

      await db.trackingRecord.update({ where: { id }, data });
    } else {
      // action === "complete"
      await db.trackingRecord.update({ where: { id }, data: { status: "COMPLETED" } });
    }

    const updated = await db.trackingRecord.findUnique({
      where: { id },
      include: trackingInclude,
    });
    if (!updated) {
      return NextResponse.json({ error: "Tracking record not found" }, { status: 404 });
    }

    return NextResponse.json({ record: shapeTrackingRecord(updated) });
  } catch (error) {
    console.error("PATCH /api/tracking/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update tracking record" }, { status: 500 });
  }
}
