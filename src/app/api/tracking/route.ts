import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  PRIORITY_RANK,
  computeWaitMinutes,
  runTrackingSimulation,
  shapeTrackingRecord,
  trackingInclude,
} from "@/lib/tracking";
import { startOfLocalDay } from "@/lib/dates";
import { isUniqueViolation, readJsonBody, zodErrorMessage } from "@/lib/validation";

const createTrackingSchema = z.object({
  patientId: z.coerce.number().int().positive("patientId must be a positive integer"),
  appointmentId: z.coerce.number().int().positive().nullish(),
  priority: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).default("NORMAL"),
});

// GET /api/tracking — THE LIVE endpoint.
// 1) Run the time-based simulation so every ACTIVE record reflects "now".
// 2) Return all ACTIVE records + today's COMPLETED records, fully shaped.
export async function GET() {
  try {
    await runTrackingSimulation();

    const records = await db.trackingRecord.findMany({
      where: {
        OR: [{ status: "ACTIVE" }, { status: "COMPLETED", updatedAt: { gte: startOfLocalDay() } }],
      },
      include: trackingInclude,
    });

    const active = records.filter((r) => r.status === "ACTIVE");
    const completedToday = records.filter((r) => r.status === "COMPLETED");

    // EMERGENCY first, then URGENT, then NORMAL; earliest stage entry first.
    const sortedActive = [...active].sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2) ||
        a.stageEnteredAt.getTime() - b.stageEnteredAt.getTime()
    );
    // Most recent completions first.
    const sortedCompleted = [...completedToday].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );

    const stageCounts: Record<string, number> = {
      REGISTRATION: 0,
      TRIAGE: 0,
      CONSULTATION: 0,
      DIAGNOSTICS: 0,
      PHARMACY: 0,
      CHECKOUT: 0,
      COMPLETED: 0,
    };
    for (const record of active) {
      if (record.currentStage in stageCounts) {
        stageCounts[record.currentStage] += 1;
      }
    }
    stageCounts.COMPLETED = completedToday.length;

    const waitMinutesList = active.map(computeWaitMinutes);
    const avgWaitMinutes = waitMinutesList.length
      ? Math.round(waitMinutesList.reduce((sum, m) => sum + m, 0) / waitMinutesList.length)
      : 0;

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      records: [...sortedActive, ...sortedCompleted].map(shapeTrackingRecord),
      stageCounts,
      queue: {
        active: active.length,
        avgWaitMinutes,
        completedToday: completedToday.length,
      },
    });
  } catch (error) {
    console.error("GET /api/tracking failed:", error);
    return NextResponse.json({ error: "Failed to load tracking records" }, { status: 500 });
  }
}

// POST /api/tracking — check a patient in (issues the next token number)
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = createTrackingSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { patientId, appointmentId, priority } = parsed.data;

    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 400 });
    }

    if (appointmentId != null) {
      const appointment = await db.appointment.findUnique({ where: { id: appointmentId } });
      if (!appointment) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 400 });
      }
      const existingTracking = await db.trackingRecord.findFirst({ where: { appointmentId } });
      if (existingTracking) {
        return NextResponse.json(
          { error: "This appointment already has a tracking record" },
          { status: 409 }
        );
      }
    }

    // Next token: max existing numeric part + 1 (start at T-101).
    const tokens = await db.trackingRecord.findMany({ select: { tokenNumber: true } });
    const maxToken = tokens.reduce((max, t) => {
      const numeric = parseInt(t.tokenNumber.replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 100);
    const tokenNumber = `T-${String(maxToken + 1).padStart(3, "0")}`;

    const created = await db.trackingRecord.create({
      data: {
        patientId,
        appointmentId: appointmentId ?? null,
        tokenNumber,
        currentStage: "REGISTRATION",
        stageEnteredAt: new Date(),
        status: "ACTIVE",
        history: "[]",
        priority,
      },
    });

    if (appointmentId != null) {
      await db.appointment.update({
        where: { id: appointmentId },
        data: { status: "CONFIRMED" },
      });
    }

    const record = await db.trackingRecord.findUnique({
      where: { id: created.id },
      include: trackingInclude,
    });
    if (!record) {
      return NextResponse.json({ error: "Failed to load tracking record" }, { status: 500 });
    }

    return NextResponse.json({ record: shapeTrackingRecord(record) }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Could not assign a unique token number, please retry" },
        { status: 409 }
      );
    }
    console.error("POST /api/tracking failed:", error);
    return NextResponse.json({ error: "Failed to create tracking record" }, { status: 500 });
  }
}
