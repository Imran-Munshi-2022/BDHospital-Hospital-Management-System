"use client";

// BDHospital — Hospital Management System
// Web Engineering Lab (CSE416) Project
// Developed by Imran Munshi (ID: 222-15-6376), Daffodil International University

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header, type TabKey } from "@/components/bdhospital/header";
import { Hero } from "@/components/bdhospital/hero";
import { Dashboard } from "@/components/bdhospital/dashboard";
import { DoctorsModule } from "@/components/bdhospital/doctors";
import { PatientsModule } from "@/components/bdhospital/patients";
import { AppointmentsModule } from "@/components/bdhospital/appointments";
import { ReviewsModule } from "@/components/bdhospital/reviews";
import { TrackingModule } from "@/components/bdhospital/tracking";
import { BlogsModule } from "@/components/bdhospital/blogs";
import { Footer } from "@/components/bdhospital/footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 2000, retry: 1, refetchOnWindowFocus: true },
  },
});

const TAB_TITLES: Record<TabKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Hospital Dashboard", subtitle: "Live overview of everything happening at BDHospital" },
  doctors: { title: "Doctor Directory", subtitle: "Meet our specialist physicians — view profiles, ratings and manage records" },
  patients: { title: "Patient Registry", subtitle: "Registered patients, medical records and live hospital status" },
  appointments: { title: "Appointments", subtitle: "Book, confirm, complete and track patient appointments" },
  reviews: { title: "Doctor Reviews", subtitle: "Verified patient feedback — the voice of our community" },
  tracking: { title: "Real-Time Patient Tracking", subtitle: "Watch patients move live through every hospital department" },
  blogs: { title: "Health Library", subtitle: "Health articles and wellness guidance from our specialists" },
};

export default function Home() {
  const [tab, setTab] = useState<TabKey>("dashboard");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>

        <Header active={tab} onTabChange={setTab} />

        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">
          {tab === "dashboard" && <Hero onTabChange={setTab} />}

          {tab !== "dashboard" && (
            <div className="border-b border-border/60 pb-4">
              <h1 className="text-2xl font-extrabold tracking-tight">{TAB_TITLES[tab].title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{TAB_TITLES[tab].subtitle}</p>
            </div>
          )}

          {tab === "dashboard" && <Dashboard onTabChange={setTab} />}
          {tab === "doctors" && <DoctorsModule />}
          {tab === "patients" && <PatientsModule />}
          {tab === "appointments" && <AppointmentsModule />}
          {tab === "reviews" && <ReviewsModule />}
          {tab === "tracking" && <TrackingModule />}
          {tab === "blogs" && <BlogsModule />}
        </main>

        <Footer onTabChange={setTab} />
      </div>
    </QueryClientProvider>
  );
}
