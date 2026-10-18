"use client";

// BDHospital — application header with tab navigation
import { cn } from "@/lib/utils";
import { HeartPulse, Moon, Sun, Download, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";

export type TabKey = "dashboard" | "doctors" | "patients" | "appointments" | "reviews" | "tracking" | "blogs";

export const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: HeartPulse },
  { key: "doctors", label: "Doctors", icon: StethoscopeIcon },
  { key: "patients", label: "Patients", icon: UsersIcon },
  { key: "appointments", label: "Appointments", icon: CalendarIcon },
  { key: "reviews", label: "Reviews", icon: StarIcon },
  { key: "tracking", label: "Live Tracking", icon: RadarIcon },
  { key: "blogs", label: "Health Blogs", icon: NewspaperIcon },
];

// Icons imported separately to keep the TABS array self-contained
import { Stethoscope as StethoscopeIcon, Users as UsersIcon, CalendarDays as CalendarIcon, Star as StarIcon, Radar as RadarIcon, Newspaper as NewspaperIcon } from "lucide-react";

export function Header({ active, onTabChange }: { active: TabKey; onTabChange: (tab: TabKey) => void }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Brand */}
        <button
          onClick={() => onTabChange("dashboard")}
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
          aria-label="BDHospital home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <HeartPulse size={20} aria-hidden />
          </span>
          <span className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-lg font-extrabold tracking-tight">
              BD<span className="text-emerald-600 dark:text-emerald-400">Hospital</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Smart Healthcare Platform
            </span>
          </span>
        </button>

        {/* Navigation tabs */}
        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              aria-current={active === tab.key ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                active === tab.key
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon size={15} aria-hidden />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <Button
            variant="destructive"
            size="sm"
            className="hidden bg-red-600 hover:bg-red-700 sm:inline-flex"
            asChild
          >
            <a href="tel:999" aria-label="Call national emergency number 999">
              <Siren size={15} className="mr-1" aria-hidden />
              Emergency 999
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
            asChild
          >
            <a href="/BDHospital-project.zip" download>
              <Download size={15} className="mr-1" aria-hidden />
              Project Zip
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            <Sun size={17} className="hidden dark:block" aria-hidden />
            <Moon size={17} className="dark:hidden" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2.5 lg:hidden" aria-label="Primary mobile">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            aria-current={active === tab.key ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active === tab.key
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon size={13} aria-hidden />
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
