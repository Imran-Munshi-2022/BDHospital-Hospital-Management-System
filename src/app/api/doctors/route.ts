import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { isUniqueViolation, readJsonBody, zodErrorMessage } from "@/lib/validation";

const doctorInclude = {
  specialty: { select: { id: true, name: true, icon: true } },
} satisfies Prisma.DoctorInclude;

const createDoctorSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.email("A valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  gender: z.enum(["Male", "Female", "Other"]).default("Male"),
  designation: z.string().min(1, "Designation is required"),
  specialtyId: z.coerce
    .number()
    .int("specialtyId must be an integer")
    .positive("specialtyId must be a positive integer"),
  bio: z.string().default(""),
  experienceYears: z.coerce.number().int().min(0).default(5),
  consultationFee: z.coerce.number().min(0).default(500),
  photo: z.string().default("/images/doctors/doctor-1.png"),
  isAvailable: z.boolean().default(true),
});

// GET /api/doctors?search=&specialtyId= — directory with specialty info
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const specialtyParam = searchParams.get("specialtyId");

    const where: Prisma.DoctorWhereInput = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { designation: { contains: search } },
        { bio: { contains: search } },
      ];
    }
    if (specialtyParam && specialtyParam !== "all") {
      const specialtyId = Number(specialtyParam);
      if (!Number.isInteger(specialtyId) || specialtyId <= 0) {
        return NextResponse.json(
          { error: "specialtyId must be a positive integer" },
          { status: 400 }
        );
      }
      where.specialtyId = specialtyId;
    }

    const doctors = await db.doctor.findMany({
      where,
      include: doctorInclude,
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("GET /api/doctors failed:", error);
    return NextResponse.json({ error: "Failed to load doctors" }, { status: 500 });
  }
}

// POST /api/doctors — create a doctor
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = createDoctorSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;

    const specialty = await db.specialty.findUnique({ where: { id: data.specialtyId } });
    if (!specialty) {
      return NextResponse.json({ error: "Specialty not found" }, { status: 400 });
    }

    const existing = await db.doctor.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { error: "A doctor with this email already exists" },
        { status: 409 }
      );
    }

    const doctor = await db.doctor.create({ data, include: doctorInclude });
    return NextResponse.json({ doctor }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "A doctor with this email already exists" },
        { status: 409 }
      );
    }
    console.error("POST /api/doctors failed:", error);
    return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 });
  }
}
