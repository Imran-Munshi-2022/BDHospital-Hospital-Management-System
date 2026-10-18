import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/specialties — list with doctor counts, name asc
export async function GET() {
  try {
    const specialties = await db.specialty.findMany({
      include: { _count: { select: { doctors: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      specialties: specialties.map(({ id, name, description, icon, _count }) => ({
        id,
        name,
        description,
        icon,
        doctorCount: _count.doctors,
      })),
    });
  } catch (error) {
    console.error("GET /api/specialties failed:", error);
    return NextResponse.json({ error: "Failed to load specialties" }, { status: 500 });
  }
}
