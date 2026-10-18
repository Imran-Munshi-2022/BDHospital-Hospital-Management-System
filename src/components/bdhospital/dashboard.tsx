"use client";

// BDHospital — dashboard: KPI cards, charts, live overview
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Stethoscope, Users, CalendarDays, Star, BedDouble, ArrowUpRight, Radio,
  ClipboardList, BadgeCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Siren } from "lucide-react";
import { fetchStats, fetchTracking, fetchDoctors, fetchReviews, STAGE_ORDER, STAGE_META } from "@/lib/api";
import { StatCard, Stars, PriorityBadge, timeAgo, formatDate } from "./shared";
import type { TabKey } from "./header";

const PIE_COLORS = ["#059669", "#0d9488", "#d97706", "#e11d48", "#7c3aed", "#65a30d", "#db2777", "#0891b2"];

export function Dashboard({ onTabChange }: { onTabChange: (tab: TabKey) => void }) {
  const stats = useQuery({ queryKey: ["stats"], queryFn: fetchStats, refetchInterval: 5000 });
  const tracking = useQuery({ queryKey: ["tracking"], queryFn: fetchTracking, refetchInterval: 4000 });
  const doctors = useQuery({ queryKey: ["doctors", ""], queryFn: () => fetchDoctors(), refetchInterval: 30000 });
  const reviews = useQuery({ queryKey: ["reviews"], queryFn: () => fetchReviews(), refetchInterval: 30000 });

  if (stats.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[88px] rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          <Skeleton className="h-80 rounded-xl lg:col-span-3" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const s = stats.data;
  if (!s) return null;

  const chartData = s.appointmentsByDay.map((d) => ({
    ...d,
    label: new Date(`${d.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));
  const pieData = s.specialtyDistribution.filter((d) => d.count > 0);
  const topDoctors = [...(doctors.data ?? [])].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 5);
  const activeRecords = (tracking.data?.records ?? []).filter((r) => r.status === "ACTIVE").slice(0, 6);
  const recentReviews = (reviews.data ?? []).slice(0, 3);
  const occupancy = Math.round(s.beds.occupancyRate);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Stethoscope} label="Total Doctors" value={s.doctors.total} sub={`${s.doctors.available} available now`} />
        <StatCard icon={Users} label="Checked In Today" value={s.patients.todayCheckedIn} sub={`${s.patients.total} registered`} accent="teal" />
        <StatCard icon={CalendarDays} label="Today's Appointments" value={s.appointments.today} sub={`${s.appointments.confirmed} confirmed`} accent="violet" />
        <StatCard icon={Star} label="Avg. Doctor Rating" value={s.reviews.avgRating.toFixed(1)} sub={`${s.reviews.total} reviews`} accent="amber" />
        <StatCard icon={BedDouble} label="Bed Occupancy" value={`${occupancy}%`} sub={`${s.beds.occupied}/${s.beds.total} occupied`} accent="rose" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-border/60 shadow-sm lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Appointments — Last 7 Days</CardTitle>
            <CardDescription>Daily appointment volume across all departments</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="apptFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 13 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="count" name="Appointments" stroke="#059669" strokeWidth={2.5} fill="url(#apptFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Doctors by Specialty</CardTitle>
            <CardDescription>Distribution of our specialist physicians</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={3} strokeWidth={0}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11.5 }} iconSize={9} iconType="circle" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Live board + top doctors + recent reviews */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-emerald-600/30 shadow-sm lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                </span>
                Live Hospital Flow
              </CardTitle>
              <CardDescription>
                {tracking.data?.queue.active ?? 0} patients in queue • avg wait {tracking.data?.queue.avgWaitMinutes ?? 0} min
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onTabChange("tracking")} className="text-emerald-700 dark:text-emerald-400">
              <Radio size={14} className="mr-1" aria-hidden />
              Track
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Stage mini-bar */}
            <div className="grid grid-cols-6 gap-1">
              {STAGE_ORDER.map((stage) => {
                const count = tracking.data?.stageCounts[stage] ?? 0;
                return (
                  <div key={stage} className="rounded-lg bg-muted px-1 py-2 text-center" title={STAGE_META[stage].label}>
                    <p className="text-sm font-bold">{count}</p>
                    <p className="truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                      {STAGE_META[stage].label.split(" ")[0]}
                    </p>
                  </div>
                );
              })}
            </div>
            <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {activeRecords.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {r.tokenNumber}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.patient.fullName}</span>
                  <PriorityBadge priority={r.priority} />
                  <span className="hidden text-xs text-muted-foreground sm:inline">{STAGE_META[r.currentStage].label}</span>
                  <span className="w-14 text-right text-xs font-semibold text-emerald-700 dark:text-emerald-400">{r.waitMinutes} min</span>
                </li>
              ))}
              {activeRecords.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">No patients in the queue right now</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Rated Doctors</CardTitle>
            <CardDescription>By verified patient reviews</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {topDoctors.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60">
                <span className="w-5 text-sm font-bold text-muted-foreground">{i + 1}</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {d.fullName.replace("Dr. ", "").split(" ").map((w) => w[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.specialty.name}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-amber-600">{d.rating.toFixed(1)}</span>
                    <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{d.reviewCount} reviews</p>
                </div>
              </div>
            ))}
            {topDoctors.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Loading doctors…</p>}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Latest Reviews</CardTitle>
                <CardDescription>What patients are saying</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onTabChange("reviews")} className="text-emerald-700 dark:text-emerald-400">
                All <ArrowUpRight size={14} aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentReviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-border/50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{r.patient.fullName} → {r.doctor.fullName}</span>
                    <Stars rating={r.rating} size={12} />
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{r.comment}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground/70">{timeAgo(r.createdAt)}</p>
                </div>
              ))}
              {recentReviews.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No reviews yet</p>}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bed Occupancy</CardTitle>
              <CardDescription>
                {s.beds.occupied} occupied • {s.beds.available} available • {s.beds.cleaning} cleaning
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Progress value={occupancy} className="h-3 flex-1" />
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{occupancy}%</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's appointment strip */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList size={16} className="text-emerald-600" aria-hidden />
              Today&apos;s Schedule
            </CardTitle>
            <CardDescription>
              {s.appointments.confirmed} confirmed • {s.appointments.scheduled} scheduled today
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => onTabChange("appointments")}>
            <BadgeCheck size={14} className="mr-1" aria-hidden />
            Manage
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              ["Scheduled", s.appointments.scheduled, "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"],
              ["Confirmed", s.appointments.confirmed, "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"],
              ["Completed (all time)", s.appointments.completed, "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"],
              ["Cancelled (all time)", s.appointments.cancelled, "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"],
            ].map(([label, count, cls]) => (
              <span key={String(label)} className={`rounded-full px-3 py-1.5 font-medium ${cls}`}>
                {label}: {count}
              </span>
            ))}
            <span className="rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
              Updated {formatDate(new Date().toISOString().slice(0, 10))}
            </span>
          </div>
        </CardContent>
      </Card>
      {/* Emergency & ambulance strip */}
      <section className="relative overflow-hidden rounded-2xl border border-red-900/20 shadow-sm">
        <Image
          src="/images/ambulance.png"
          alt="BDHospital ambulance at the emergency entrance"
          width={1344}
          height={768}
          className="h-40 w-full object-cover sm:h-48"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 sm:p-8">
          <p className="flex items-center gap-2 text-lg font-extrabold text-white sm:text-2xl">
            <Siren size={22} className="text-red-400" aria-hidden />
            24/7 Emergency &amp; Ambulance Service
          </p>
          <p className="max-w-lg text-sm text-slate-200/90">
            Our emergency department never sleeps. Call national emergency <span className="font-bold text-white">999</span> or
            ambulance hotline <span className="font-bold text-white">16163</span> — our response team is on standby.
          </p>
          <div className="mt-1 flex gap-2">
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700" asChild>
              <a href="tel:999">Call 999</a>
            </Button>
            <Button variant="secondary" className="bg-white/15 text-white backdrop-blur-sm hover:bg-white/25" asChild>
              <a href="tel:16163">Ambulance 16163</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
