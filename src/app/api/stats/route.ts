import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeWaitMinutes, runTrackingSimulation } from "@/lib/tracking";
import { dateDaysAgo, startOfLocalDay, toDateString, todayString } from "@/lib/dates";

// GET /api/stats — dashboard analytics
export async function GET() {
  try {
    // Keep the live hospital board in sync with wall-clock time first.
    await runTrackingSimulation();

    const today = todayString();

    const [
      doctorTotal,
      doctorAvailable,
      patientTotal,
      todayCheckedIn,
      appointmentTotal,
      appointmentToday,
      statusGroups,
      reviewAgg,
      bedTotal,
      bedStatusGroups,
      activeTracking,
      activeRecords,
      specialtiesWithCounts,
      appointmentDateGroups,
    ] = await Promise.all([
      db.doctor.count(),
      db.doctor.count({ where: { isAvailable: true } }),
      db.patient.count(),
      db.trackingRecord.count({ where: { createdAt: { gte: startOfLocalDay() } } }),
      db.appointment.count(),
      db.appointment.count({ where: { date: today } }),
      db.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
      db.review.aggregate({ _avg: { rating: true }, _count: true }),
      db.bed.count(),
      db.bed.groupBy({ by: ["status"], _count: { _all: true } }),
      db.trackingRecord.count({ where: { status: "ACTIVE" } }),
      db.trackingRecord.findMany({
        where: { status: "ACTIVE" },
        select: { history: true, stageEnteredAt: true, status: true },
      }),
      db.specialty.findMany({ select: { name: true, _count: { select: { doctors: true } } } }),
      db.appointment.groupBy({ by: ["date"], _count: { _all: true } }),
    ]);

    const statusCounts: Record<string, number> = {
      SCHEDULED: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const group of statusGroups) statusCounts[group.status] = group._count._all;

    const bedCounts: Record<string, number> = { AVAILABLE: 0, OCCUPIED: 0, CLEANING: 0 };
    for (const group of bedStatusGroups) bedCounts[group.status] = group._count._all;

    // Last 7 days (including today), oldest first for left-to-right charts.
    const countByDate = new Map(appointmentDateGroups.map((g) => [g.date, g._count._all]));
    const appointmentsByDay = Array.from({ length: 7 }, (_, i) => {
      const date = toDateString(dateDaysAgo(6 - i));
      return { date, count: countByDate.get(date) ?? 0 };
    });

    const specialtyDistribution = specialtiesWithCounts
      .map((s) => ({ name: s.name, count: s._count.doctors }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const waitMinutesList = activeRecords.map(computeWaitMinutes);
    const avgWaitMinutes = waitMinutesList.length
      ? Math.round(waitMinutesList.reduce((sum, m) => sum + m, 0) / waitMinutesList.length)
      : 0;

    const occupied = bedCounts.OCCUPIED;
    const occupancyRate = bedTotal ? Math.round((occupied / bedTotal) * 10000) / 100 : 0;
    const avgRating = reviewAgg._avg.rating == null ? 0 : Math.round(reviewAgg._avg.rating * 100) / 100;

    return NextResponse.json({
      doctors: { total: doctorTotal, available: doctorAvailable },
      patients: { total: patientTotal, todayCheckedIn },
      appointments: {
        today: appointmentToday,
        total: appointmentTotal,
        scheduled: statusCounts.SCHEDULED ?? 0,
        confirmed: statusCounts.CONFIRMED ?? 0,
        completed: statusCounts.COMPLETED ?? 0,
        cancelled: statusCounts.CANCELLED ?? 0,
      },
      reviews: { total: reviewAgg._count, avgRating },
      beds: {
        total: bedTotal,
        occupied,
        available: bedCounts.AVAILABLE,
        cleaning: bedCounts.CLEANING,
        occupancyRate,
      },
      appointmentsByDay,
      specialtyDistribution,
      activeTracking,
      avgWaitMinutes,
    });
  } catch (error) {
    console.error("GET /api/stats failed:", error);
    return NextResponse.json({ error: "Failed to load statistics" }, { status: 500 });
  }
}
