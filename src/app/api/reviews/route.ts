import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { readJsonBody, zodErrorMessage } from "@/lib/validation";

const reviewInclude = {
  doctor: { select: { id: true, fullName: true, photo: true } },
  patient: { select: { id: true, fullName: true } },
} satisfies Prisma.ReviewInclude;

const createReviewSchema = z.object({
  doctorId: z.coerce.number().int().positive("doctorId must be a positive integer"),
  patientId: z.coerce.number().int().positive("patientId must be a positive integer"),
  rating: z.coerce
    .number()
    .int("rating must be a whole number")
    .min(1, "rating must be between 1 and 5")
    .max(5, "rating must be between 1 and 5"),
  comment: z.string().min(1, "comment is required"),
});

/** Recompute (and persist) a doctor's aggregate rating and review count. */
async function recomputeDoctorRating(doctorId: number): Promise<void> {
  const agg = await db.review.aggregate({
    where: { doctorId },
    _avg: { rating: true },
    _count: true,
  });
  await db.doctor.update({
    where: { id: doctorId },
    data: {
      rating: agg._avg.rating == null ? 0 : Math.round(agg._avg.rating * 100) / 100,
      reviewCount: agg._count,
    },
  });
}

// GET /api/reviews?doctorId=&patientId=
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorIdParam = searchParams.get("doctorId");
    const patientIdParam = searchParams.get("patientId");

    const where: Prisma.ReviewWhereInput = {};
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

    const reviews = await db.review.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("GET /api/reviews failed:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

// POST /api/reviews — create a review, then update the doctor's aggregate rating
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = createReviewSchema.safeParse(body.data);
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

    const review = await db.review.create({ data, include: reviewInclude });

    await recomputeDoctorRating(data.doctorId);

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews failed:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
