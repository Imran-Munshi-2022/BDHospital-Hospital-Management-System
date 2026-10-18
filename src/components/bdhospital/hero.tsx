"use client";

// BDHospital — hero banner (dashboard tab)
import Image from "next/image";
import { CalendarDays, ShieldCheck, Stethoscope, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TabKey } from "./header";

export function Hero({ onTabChange }: { onTabChange: (tab: TabKey) => void }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 shadow-sm">
      <Image
        src="/images/hero-hospital.png"
        alt="BDHospital modern hospital building exterior at dusk with emergency entrance and ambulance"
        width={1440}
        height={736}
        priority
        className="h-[300px] w-full object-cover sm:h-[380px]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-slate-900/10" />

      <div className="absolute inset-0 flex flex-col justify-center gap-4 p-6 sm:p-10">
        <div className="max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur-sm">
            <Activity size={13} aria-hidden />
            Web Engineering Lab — CSE416 Project
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            BDHospital Management System
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-200/90 sm:text-base">
            A complete digital healthcare platform — doctor &amp; patient management, appointment
            scheduling, verified doctor reviews and real-time patient flow tracking across every
            hospital department.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => onTabChange("appointments")}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <CalendarDays size={16} className="mr-1.5" aria-hidden />
              Book an Appointment
            </Button>
            <Button
              onClick={() => onTabChange("tracking")}
              variant="secondary"
              className="bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
            >
              <Activity size={16} className="mr-1.5" aria-hidden />
              Live Patient Tracking
              <ArrowRight size={15} className="ml-1" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Student credit card */}
        <div className="mt-2 inline-flex w-fit flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              IM
            </span>
            Imran Munshi
          </span>
          <span className="text-xs text-slate-300">ID: 222-15-6376</span>
          <span className="hidden items-center gap-1.5 text-xs text-slate-300 sm:flex">
            <ShieldCheck size={13} className="text-emerald-400" aria-hidden />
            Daffodil International University
          </span>
          <span className="hidden items-center gap-1.5 text-xs text-slate-300 md:flex">
            <Stethoscope size={13} className="text-emerald-400" aria-hidden />
            Dept. of CSE
          </span>
        </div>
      </div>
    </section>
  );
}
