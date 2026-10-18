import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isRecordNotFound, parseIdParam } from "@/lib/validation";

type RouteCtx = { params: Promise<{ id: string }> };

// DELETE /api/reviews/[id] — delete, then recompute the doctor's aggregates
export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await db.review.delete({ where: { id } });

    const agg = await db.review.aggregate({
      where: { doctorId: review.doctorId },
      _avg: { rating: true },
      _count: true,
    });
    await db.doctor.update({
      where: { id: review.doctorId },
      data: {
        rating: agg._avg.rating == null ? 0 : Math.round(agg._avg.rating * 100) / 100,
        reviewCount: agg._count,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    console.error("DELETE /api/reviews/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
