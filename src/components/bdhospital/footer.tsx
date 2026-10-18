"use client";

// BDHospital — sticky footer
import { HeartPulse, GraduationCap, MapPin, Phone } from "lucide-react";
import type { TabKey } from "./header";

export function Footer({ onTabChange }: { onTabChange: (tab: TabKey) => void }) {
  const links: { key: TabKey; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "doctors", label: "Find Doctors" },
    { key: "appointments", label: "Appointments" },
    { key: "reviews", label: "Doctor Reviews" },
    { key: "tracking", label: "Live Tracking" },
    { key: "blogs", label: "Health Blogs" },
  ];
  return (
    <footer className="mt-auto border-t border-emerald-900/20 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <HeartPulse size={18} aria-hidden />
            </span>
            <span className="text-lg font-extrabold text-white">
              BD<span className="text-emerald-400">Hospital</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            A modern hospital management system featuring doctor &amp; patient records, appointment
            scheduling, verified doctor reviews and real-time patient flow tracking — built as a
            full-stack web application.
          </p>
        </div>

        <nav aria-label="Footer">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Features</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {links.map((l) => (
              <li key={l.key}>
                <button
                  onClick={() => onTabChange(l.key)}
                  className="text-slate-400 transition-colors hover:text-emerald-400"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <MapPin size={15} className="shrink-0 text-emerald-400" aria-hidden />
              Daffodil Smart City, Birulia, Savar, Dhaka 1216
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="shrink-0 text-emerald-400" aria-hidden />
              Emergency Hotline: 999 &nbsp;•&nbsp; Ambulance: 16163
            </li>
            <li className="flex items-center gap-2">
              <GraduationCap size={15} className="shrink-0 text-emerald-400" aria-hidden />
              <span>
                <span className="font-medium text-slate-200">Imran Munshi</span> (222-15-6376)
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-center text-xs text-slate-400 sm:flex-row sm:px-6">
          <p>© 2025 BDHospital — Hospital Management System. All rights reserved.</p>
          <p className="font-medium text-slate-300">
            Web Engineering Lab (CSE416) • Developed by Imran Munshi • Daffodil International University
          </p>
        </div>
      </div>
    </footer>
  );
}
