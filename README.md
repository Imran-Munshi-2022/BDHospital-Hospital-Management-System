

# 🏥 BDHospital — Smart Healthcare & Hospital Management System

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

**BDHospital Management System** is a complete full-stack digital healthcare platform that digitizes the entire workflow of a multi-specialty hospital — from doctor and patient records to appointment scheduling, verified doctor reviews, and real-time patient flow tracking across every hospital department.

Built as an interactive single-page application with **7 core modules**, backed by a **RESTful API** and a **relational database**, featuring **Light/Dark themes** and a **responsive mobile-first layout**.

---

## 👨‍💻 Developer & Academic Information

* **Developer:** Imran Munshi
* **Student ID:** `222-15-6376`
* **Department:** Computer Science and Engineering (CSE)
* **Institution:** Daffodil International University (DIU)
* **Course:** Web Engineering Lab (`CSE416`)

---

## 📸 Application Screenshots (1–16)

> **Note:** If your images are uploaded inside a folder (e.g., `public/` or `screenshots/`), prefix the filenames below with the folder path (e.g., `screenshots/01-dashboard-full.jpg`). Ensure filenames `11` through `16` match your exact uploaded image extensions (`.jpg` or `.png`).

### 📊 Dashboard & Doctor Management
| 01. Hospital Dashboard (Analytics) | 02. Doctor Directory |
| :---: | :---: |
| ![01 Dashboard](01-dashboard-full.jpg) | ![02 Doctor Directory](02-doctors-directory-full.jpg) |

| 03. Doctor Profile & Reviews Dialog | 04. Write a Review Modal |
| :---: | :---: |
| ![03 Doctor Profile](03-doctor-profile-dialog-dark.jpg) | ![04 Write Review](04-write-review-dialog-dark.jpg) |

### 🧑‍🤝‍🧑 Patient Registry & Appointment Scheduling
| 05. Patient Registry | 06. Patient Profile & Medical Journey |
| :---: | :---: |
| ![05 Patient Registry](05-patients-registry-full.jpg) | ![06 Patient Profile](06-patient-profile-dialog-dark.png) |

| 07. Appointments Management | 08. Book an Appointment Dialog |
| :---: | :---: |
| ![07 Appointments](07-appointments-full.jpg) | ![08 Booking Dialog](08-booking-dialog-dark.jpg) |

### ⭐ Reviews, Real-Time Tracking, Wards & Health Blogs
| 09. Verified Doctor Reviews Wall | 10. Real-Time Patient Tracking & Wards |
| :---: | :---: |
| ![09 Doctor Reviews](09-reviews-full.jpg) | ![10 Live Tracking](10-live-tracking-full.jpg) |

| 11. Live Patient Vitals & Journey Modal | 12. Ward & Bed Occupancy Management |
| :---: | :---: |
| ![11 Patient Tracking Modal](11-tracking-detail-dialog.jpg) | ![12 Ward Management](12-ward-bed-management.jpg) |

| 13. Health Library (Blogs) | 14. In-App Health Article Reader |
| :---: | :---: |
| ![13 Health Blogs](13-health-blogs-full.jpg) | ![14 Article Reader](14-blog-reader-dialog.jpg) |

| 15. Publish Health Article Dialog | 16. Light Mode / Emergency Overview |
| :---: | :---: |
| ![15 Publish Blog](15-publish-blog-dialog.jpg) | ![16 Light Theme View](16-light-theme-dashboard.jpg) |

---

## ✨ Key Modules & Features

### 📊 Module 1: Hospital Dashboard (Analytics)
* **Live KPI Cards:** Real-time metrics for doctors on duty, patients checked in today, today's scheduled/confirmed appointments, average doctor rating, and bed occupancy percentage.
* **Interactive Data Visualization:** 7-day daily appointment volume area chart and doctors-by-specialty distribution donut chart powered by Recharts.
* **Live Hospital Flow Mini-Board:** Instant overview of active patient queue tokens, department stages, priority statuses, and average wait times.
* **Leaderboards & Feeds:** Top-rated doctors leaderboard and latest verified patient reviews feed.
* **Emergency & Ambulance Banner:** 24/7 quick-access emergency triggers for national hotline `999` and ambulance hotline `16163`.

### 🩺 Module 2: Doctor Management
* **Specialist Directory:** Displays doctor profiles with specialty badges, designations, consultation fees (BDT), years of experience, star ratings, and real-time availability badges (`Available` / `Cleaning`).
* **Search & Filtering:** Instant search by name, designation, or bio, combined with a specialty filter dropdown.
* **Full CRUD Operations:** Add new doctors, edit existing profiles (with photo picker), and safely delete records with cascading database cleanup.
* **Doctor Profile Dialog:** Comprehensive modal showcasing biography, direct email/phone contact info, consultation statistics, star-rating breakdown, and verified patient reviews.

### 🧑‍🤝‍🧑 Module 3: Patient Management
* **Patient Registry:** Centralized directory tracking patient demographics (age, gender), blood groups (`O+`, `A+`, `AB-`, etc.), phone numbers, insurance IDs, and live hospital status.
* **Multi-Field Search:** Filter patients instantaneously across name, email, phone number, or blood group.
* **Patient Profile Journey:** Complete longitudinal view of a patient's appointment history, reviews written, guardian contact info, and current hospital stage.
* **One-Click Check-In:** Issues a live queue token (`T-101`, `T-102`, etc.) and immediately routes the patient into the real-time hospital tracking board.

### 📅 Module 4: Appointment Management
* **Smart Booking Dialog:** Interactive doctor and patient selectors, date picker, reason for visit input, and an intelligent time-slot picker that automatically greys out already-booked slots.
* **Double-Booking Prevention:** Server-side conflict validation returning `HTTP 409` to prevent overlapping schedules.
* **Full Status Workflow:** Track and filter appointments across `SCHEDULED` → `CONFIRMED` → `COMPLETED` (or `CANCELLED`).
* **Send to Queue Action:** One-click transition that checks a confirmed appointment patient directly into the live hospital flow.

### ⭐ Module 5: Doctor Reviews (Flagship Feature #1)
* **Verified Patient Feedback:** Patients can submit 1–5 star ratings with detailed written feedback for any specialist.
* **Automatic Score Recomputation:** Doctor rating averages and review counts dynamically recalculate on every submission or deletion.
* **Dedicated Reviews Hub:** Features overall community rating, 5-star distribution histogram, percentage of 4★/5★ reviews, doctor-specific filtering, and review moderation.

### 📡 Module 6: Real-Time Patient Tracking (Flagship Feature #2)
* **6-Department Live Flow Board:** Tracks patient movement across **Registration** → **Triage & Vitals** → **Consultation** → **Diagnostics** → **Pharmacy** → **Checkout**.
* **Auto-Refreshing Polling:** Real-time board updates automatically every 3 seconds via TanStack Query.
* **Priority & Progress Tracking:** Displays queue tokens, animated priority badges (`Normal`, `Urgent`, `EMERGENCY`), per-stage progress bars, and completed daily journeys with total duration.
* **Patient Vitals & Stage Control:** Interactive modal displaying live vitals (BP, pulse, temperature, SpO₂), assigned physician, and manual **Advance Stage** / **Complete Journey** controls, plus walk-in arrival simulation.
* **Ward & Bed Management:** Visual occupancy management across **5 hospital wards** (*General Ward, Intensive Care Unit (ICU), Emergency Ward, Maternity Ward, Pediatric Ward*) with interactive bed status toggles (`Available`, `Occupied`, `Cleaning`).

### 📰 Module 7: Health Library (Blogs)
* **Medical Articles Hub:** Educational health articles authored by BDHospital specialists, complete with cover images, medical categories, view counters, and author attribution.
* **In-App Reader & Publishing:** Clean typeset article reader modal and a **Publish Article** dialog for doctors to contribute new health posts.

### 🎨 UX & Engineering Highlights
* **Theme Support:** Seamless Light (`☀️`) and Dark (`🌙`) theme switching.
* **Responsive Architecture:** Mobile-first layout with sticky navigation header and sticky footer.
* **Polished Feedback States:** Toast notifications, loading skeletons, empty state illustrations, and confirmation dialogs for destructive actions.
* **Accessibility:** Full ARIA labeling and keyboard navigation support.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling & UI** | Tailwind CSS 4, shadcn/ui, Lucide Icons, Framer Motion |
| **Real-Time State** | TanStack Query v5 (3s / 5s live polling) |
| **Backend API** | Next.js Route Handlers (RESTful API Architecture) |
| **Validation** | Zod Schema Validation |
| **Database & ORM** | SQLite via Prisma ORM (8 Relational Models) |
| **Data Visualization** | Recharts (Area & Donut Charts) |

---

## 🗄️ Database Architecture & REST API

### Relational Database Schema (8 Models via Prisma)
* `Specialty` (8 departments) · `Doctor` (10 specialists) · `Patient` (15 records) · `Appointment` (40 bookings) · `Review` (22 feedbacks) · `TrackingRecord` (live flow states) · `Bed` (20 beds across 5 wards) · `Blog` (4 medical articles) — engineered with full referential integrity and cascading deletes.

### REST API Endpoints (23 Endpoints across 11 Groups)
* `/api/stats` · `/api/doctors` · `/api/patients` · `/api/appointments` · `/api/reviews` · `/api/tracking` · `/api/beds` · `/api/blogs` · `/api/specialties` — supporting full CRUD operations, Zod input validation, and structured error handling.

---

## 🚀 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Imran-Munshi-2022/your-repo-name.git](https://github.com/Imran-Munshi-2022/your-repo-name.git)
   cd your-repo-name
