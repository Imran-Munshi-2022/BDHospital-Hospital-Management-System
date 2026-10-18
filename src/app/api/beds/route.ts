import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const bedInclude = {
  patient: { select: { id: true, fullName: true, bloodGroup: true } },
} satisfies Prisma.BedInclude;

const WARD_ORDER = ["GENERAL", "ICU", "EMERGENCY", "MATERNITY", "PEDIATRIC"] as const;

// GET /api/beds — all beds + per-ward occupancy summary
export async function GET() {
  try {
    const beds = await db.bed.findMany({
      include: bedInclude,
      orderBy: { bedNumber: "asc" },
    });

    const wards = WARD_ORDER.map((ward) => {
      const wardBeds = beds.filter((b) => b.ward === ward);
      return {
        ward,
        total: wardBeds.length,
        occupied: wardBeds.filter((b) => b.status === "OCCUPIED").length,
        available: wardBeds.filter((b) => b.status === "AVAILABLE").length,
        cleaning: wardBeds.filter((b) => b.status === "CLEANING").length,
      };
    });

    return NextResponse.json({ beds, wards });
  } catch (error) {
    console.error("GET /api/beds failed:", error);
    return NextResponse.json({ error: "Failed to load beds" }, { status: 500 });
  }
}
