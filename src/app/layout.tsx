import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BDHospital — Hospital Management System",
  description:
    "BDHospital: a full-stack hospital management system with doctor & patient management, appointment scheduling, verified doctor reviews and real-time patient flow tracking. Web Engineering Lab (CSE416) project by Imran Munshi (222-15-6376), Daffodil International University.",
  keywords: [
    "BDHospital",
    "Hospital Management System",
    "Healthcare",
    "Next.js",
    "Prisma",
    "Real-time Patient Tracking",
    "Doctor Reviews",
    "CSE416",
  ],
  authors: [{ name: "Imran Munshi" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
          <SonnerToaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
