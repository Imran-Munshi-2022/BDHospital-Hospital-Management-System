import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { isUniqueViolation, readJsonBody, zodErrorMessage } from "@/lib/validation";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

const createPatientSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.email("A valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  gender: z.enum(["Male", "Female", "Other"]).default("Male"),
  age: z.coerce.number().int().min(0).max(120).default(30),
  bloodGroup: z.enum(BLOOD_GROUPS).default("O+"),
  address: z.string().default(""),
  insuranceId: z.string().nullish(),
});

// GET /api/patients?search= — matches fullName/email/phone/bloodGroup
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";

    const where: Prisma.PatientWhereInput = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { bloodGroup: { contains: search } },
      ];
    }

    const patients = await db.patient.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ patients });
  } catch (error) {
    console.error("GET /api/patients failed:", error);
    return NextResponse.json({ error: "Failed to load patients" }, { status: 500 });
  }
}

// POST /api/patients — create a patient
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = createPatientSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;

    const existing = await db.patient.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { error: "A patient with this email already exists" },
        { status: 409 }
      );
    }

    const patient = await db.patient.create({ data });
    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "A patient with this email already exists" },
        { status: 409 }
      );
    }
    console.error("POST /api/patients failed:", error);
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}
