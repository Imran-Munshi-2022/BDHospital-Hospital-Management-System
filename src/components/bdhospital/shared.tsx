"use client";

// BDHospital — shared presentational components
import { cn } from "@/lib/utils";
import { Star, StarHalf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// ---------------- Star rating display ----------------

export function Stars({ rating, size = 14, className }: { rating: number; size?: number; className?: string }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <Star key={i} size={size} className="fill-amber-400 text-amber-400" aria-hidden />;
        if (i === full && half)
          return (
            <span key={i} className="relative inline-flex" aria-hidden>
              <Star size={size} className="text-amber-400" />
              <StarHalf size={size} className="absolute left-0 top-0 fill-amber-400 text-amber-400" />
            </span>
          );
        return <Star key={i} size={size} className="text-muted-foreground/40" aria-hidden />;
      })}
    </span>
  );
}

// ---------------- Interactive star picker ----------------

export function StarPicker({ value, onChange, size = 24 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Select rating">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={`${v} star${v > 1 ? "s" : ""}`}
          onClick={() => onChange(v)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Star size={size} className={v <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"} />
        </button>
      ))}
    </div>
  );
}

// ---------------- Status & priority badges ----------------

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  COMPLETED: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  AVAILABLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  OCCUPIED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  CLEANING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-0 font-medium capitalize", STATUS_STYLES[status] ?? "bg-muted text-muted-foreground", className)}>
      {status.toLowerCase()}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "EMERGENCY")
    return (
      <Badge className="border-0 bg-red-600 text-white font-semibold tracking-wide animate-pulse">
        EMERGENCY
      </Badge>
    );
  if (priority === "URGENT")
    return <Badge className="border-0 bg-orange-500 text-white font-semibold">URGENT</Badge>;
  return <Badge variant="secondary" className="border-0 font-medium text-muted-foreground">Normal</Badge>;
}

// ---------------- Initials avatar ----------------

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
];

export function InitialsAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const color = AVATAR_COLORS[(name.charCodeAt(0) + name.length) % AVATAR_COLORS.length];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", color)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

// ---------------- Stat card ----------------

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "emerald",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "emerald" | "teal" | "amber" | "rose" | "violet";
}) {
  const accents: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    teal: "bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  };
  return (
    <Card className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", accents[accent])}>
          <Icon size={22} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Empty / loading states ----------------

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon size={22} className="text-muted-foreground" aria-hidden />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-64 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ---------------- Small helpers ----------------

export function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
