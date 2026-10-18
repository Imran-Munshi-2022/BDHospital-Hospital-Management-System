# BDHospital — Redevelopment Worklog

Project: BDHospital (Hospital Management System redevelopment)
Course: Web Engineering Lab — CSE416
Student: Imran Munshi • ID: 222-15-6376 • Daffodil International University
Source: redevelopment of uploaded Django "Hospital-Management" project into a modern full-stack Next.js app.

---
Task ID: 1
Agent: Orchestrator (Z.ai Code)
Task: Extract & analyze original Hospital-Management.zip

Work Log:
- Extracted upload/Hospital-Management.zip to /tmp/hm-original
- Original is a Django + SQLite app with apps: doctors, patients, users, hospital
- Original models: Users (doctor/patient roles), Address, Specialty, Doctors, Patients, Appointment (status/time FKs), Blogs, Comments, Category

Stage Summary:
- Original features to carry over: doctors directory w/ specialties, patients, appointment booking + accept/cancel, health blogs
- New features to add: Doctor Reviews (star ratings), Patient Real-time Tracking (live department flow + bed occupancy), Dashboard analytics, Bed/Ward management
- Old stack (Django/Python) fully replaced by: Next.js 16 App Router + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite) + TanStack Query + Recharts

---
Task ID: 2
Agent: Orchestrator (Z.ai Code)
Task: Design full architecture for BDHospital (DB schema, API contract, UI plan, images)

Work Log:
- Designed complete Prisma schema (Specialty, Doctor, Patient, Appointment, Review, TrackingRecord, Bed, Blog)
- Designed complete REST API contract (see spec below)
- Designed UI plan: single "/" route with tab navigation: Dashboard | Doctors | Patients | Appointments | Reviews | Live Tracking | Blogs
- Planned AI-generated real images (18 total): hero, 10 doctor portraits, 2 ward photos, 4 blog covers, ambulance

Stage Summary:
=== ARCHITECTURE SPEC (binding for all agents) ===

PROJECT NAME: BDHospital. All UI text in English. Medical teal/emerald accent palette (NO blue/indigo).
Only route visible: src/app/page.tsx (single page app with tabs). All backend via src/app/api/*.

--- PRISMA SCHEMA (exact) ---
models: Specialty, Doctor, Patient, Appointment, Review, TrackingRecord, Bed, Blog
- Specialty: id, name (unique), description, icon (default "Stethoscope")
- Doctor: id, fullName, email(unique), phone, gender, designation, specialtyId→Specialty, bio, experienceYears, consultationFee, rating, reviewCount, photo (path "/images/doctors/doctor-N.png"), isAvailable, createdAt; relations: appointments[], reviews[], blogs[]
- Patient: id, fullName, email(unique), phone, gender, age, bloodGroup, address, insuranceId?, createdAt; relations: appointments[], reviews[], trackingRecords[], beds[]
- Appointment: id, doctorId→Doctor(cascade), patientId→Patient(cascade), date ("YYYY-MM-DD" string), timeSlot ("10:00 AM"), reason, status (SCHEDULED|CONFIRMED|COMPLETED|CANCELLED), notes?, createdAt
- Review: id, doctorId→Doctor(cascade), patientId→Patient(cascade), rating (1-5 int), comment, createdAt
- TrackingRecord: id, patientId→Patient(cascade), appointmentId?→Appointment(SetNull, unique), tokenNumber(unique "T-101"), currentStage (REGISTRATION|TRIAGE|CONSULTATION|DIAGNOSTICS|PHARMACY|CHECKOUT), stageEnteredAt DateTime, priority (NORMAL|URGENT|EMERGENCY), room?, vitals? (JSON string), status (ACTIVE|COMPLETED), history? (JSON string [{stage,enteredAt,durationMin}]), createdAt, updatedAt
- Bed: id, ward (GENERAL|ICU|EMERGENCY|MATERNITY|PEDIATRIC), bedNumber(unique), status (AVAILABLE|OCCUPIED|CLEANING), patientId?→Patient(SetNull)
- Blog: id, title, summary, content, category, coverImage, authorId→Doctor(cascade), publishedAt, views
- ALL required relations must declare onDelete: Cascade explicitly; optional → SetNull. SQLite, db file at db/custom.db, .env DATABASE_URL=file:../db/custom.db (relative, portable).

--- API CONTRACT (all under src/app/api, Next.js route handlers, use db from "@/lib/db") ---
Success: JSON object; errors: { error: string } + proper status. Lists sorted: appointments date desc; reviews createdAt desc; patients createdAt desc; blogs publishedAt desc.
1. GET /api/stats → { doctors:{total,available}, patients:{total,todayCheckedIn}, appointments:{today,total,scheduled,confirmed,completed,cancelled}, reviews:{total,avgRating}, beds:{total,occupied,available,cleaning,occupancyRate}, appointmentsByDay:[{date,count}] (7 days incl today), specialtyDistribution:[{name,count}], activeTracking, avgWaitMinutes }
2. GET /api/doctors?search=&specialtyId= → { doctors:[doctor + specialty{name,icon}] }; POST /api/doctors (body fields above, validate email unique); GET/PATCH/DELETE /api/doctors/[id] (include specialty + _count)
3. GET /api/patients?search= → { patients:[...] }; POST; PATCH/DELETE /api/patients/[id]
4. GET /api/appointments?status=&date=&doctorId=&patientId= → { appointments:[...+doctor{id,fullName,photo,specialty{name}}+patient{id,fullName,gender,age,bloodGroup}] }; POST (validate doctor/patient exist, reject double-booking same doctor+date+timeSlot with 409); PATCH /api/appointments/[id] ({status} or field edits); DELETE
5. GET /api/reviews?doctorId=&patientId= → { reviews:[...+doctor{id,fullName,photo},patient{id,fullName}] }; POST {doctorId,patientId,rating 1-5,comment} → then recompute doctor.rating (avg, 2dp) & reviewCount; DELETE /api/reviews/[id] → recompute
6. GET /api/tracking → LIVE endpoint. First run simulation for ACTIVE records (see below), then → { serverTime, records:[{...record, patient(+age,gender,bloodGroup), appointment?{doctor{fullName,specialty{name}}}, stageProgress 0-100, waitMinutes, stages:[{key,label,status(done|current|pending),enteredAt}], vitals(parsed)}], stageCounts:{per stage incl COMPLETED count}, queue:{active,avgWaitMinutes,completedToday} }
7. POST /api/tracking {patientId, appointmentId?, priority} → tokenNumber = "T-" + (max numeric token + 1, pad 3, start 101); currentStage=REGISTRATION; stageEnteredAt=now; history="[]"; if appointmentId → appointment.status="CONFIRMED"; returns full record shape
8. PATCH /api/tracking/[id] {action:"advance"|"complete"} → advance = move to next stage now (append current to history); complete = status COMPLETED. Returns record shape
9. GET /api/beds → { beds:[...+patient?{id,fullName,bloodGroup}], wards:[{ward,total,occupied,available,cleaning}] }; PATCH /api/beds/[id] {status, patientId?} (OCCUPIED requires patientId)
10. GET /api/blogs → { blogs:[...+author{id,fullName,photo,specialty{name}}] }; GET /api/blogs/[id] (increment views, return); POST /api/blogs; DELETE /api/blogs/[id]
11. GET /api/specialties → { specialties:[...+doctorCount] }

TRACKING SIMULATION (in GET /api/tracking before reading):
Stage durations (minutes, deterministic per record via hash of (record.id*31+stageIndex) mapped into range): REGISTRATION 3-6, TRIAGE 4-8, CONSULTATION 6-12, DIAGNOSTICS 8-15, PHARMACY 3-7, CHECKOUT 2-5.
For each ACTIVE record: elapsedMin=(now-stageEnteredAt)/60000; while elapsed >= duration(currentStage): append {stage, enteredAt:stageEnteredAt, durationMin} to history; stageEnteredAt += duration*60000 (carry remainder); elapsed -= duration; move to next stage (order as listed). Beyond CHECKOUT → status=COMPLETED. When entering TRIAGE and vitals null → generate deterministic vitals from patientId: {bp:"1X0/7Y",pulse:62-96,temp:97.8-99.4,spo2:95-100}. room computed per stage: REGISTRATION "Reception Desk", TRIAGE "Triage Room A|B", CONSULTATION "Cabin N" (doctorId%8+1), DIAGNOSTICS "Pathology Lab|Radiology", PHARMACY "Pharmacy Counter", CHECKOUT "Billing Desk". stageProgress = min(100, elapsed/duration*100). Persist advances via updateMany/update (only when stage changed). Update DB rows in a loop (≤ ~30 rows, fine).

--- IMAGES (Task 3-a, by Orchestrator; saved to public/images) ---
hero-hospital.png (1440x720), doctors/doctor-1..10.png (864x1152), wards/icu.png + wards/general.png (1344x768), blog/blog-1..4.png (1344x768), ambulance.png (1344x768). Seed data references these paths.

--- SEED (Task 3-b, by backend agent; prisma/seed.mjs, runs with bun or node) ---
Idempotent (clear tables in FK-safe order, then create): 8 specialties; 10 doctors (Bangladeshi names, photos doctor-1..10.png, varied fees 600-1500 BDT, experience 5-25y); 15 patients (BD names, emails, phones +8801..., ages 8-75, blood groups); ~40 appointments spread over last 7 days incl today with all statuses; ~22 reviews (ratings 3-5, realistic comments) + recompute doctor aggregates; 7 ACTIVE tracking records (varied stages, stageEnteredAt minutes in the past so movement is visible live) + 3 COMPLETED today; 20 beds across 5 wards (mix AVAILABLE/OCCUPIED/CLEANING, some linked to patients); 4 blogs (multi-paragraph health content, covers blog-1..4.png). package.json script: "db:seed".

--- FRONTEND PLAN (Task 4, by Orchestrator) ---
Single page tab app (client): Header (logo, BDHospital, nav tabs, theme toggle, Download Project zip, Emergency btn) → Hero (dashboard tab) → content per tab → sticky footer (mt-auto): "Developed by Imran Munshi • 222-15-6376 • Daffodil International University • CSE416". TanStack Query; tracking + stats poll every 3-5s (LIVE badges with pulsing dot); recharts for dashboard; sonner toasts; framer-motion subtle transitions.

--- DELIVERABLE (Task 6, by Orchestrator) ---
Zip of full project (src, prisma, db/custom.db with data, public incl images, configs, README.md with setup/API docs) → public/BDHospital-project.zip, downloadable from the app UI.

---
Task ID: 3-b
Agent: full-stack-developer + Orchestrator (completion)
Task: Build complete backend: Prisma schema, 11 API route groups, seed script

Work Log:
- full-stack-developer agent implemented prisma schema (8 models, cascade rules), src/lib/tracking.ts (deterministic live simulation), src/lib/dates.ts, src/lib/validation.ts, and all API routes: stats, doctors (+[id]), patients (+[id]), appointments (+[id], 409 double-booking), reviews (+[id], rating recompute), tracking (+[id] advance/complete), beds (+[id]), blogs (+[id]), specialties. (Agent hit tool timeout before finishing; orchestrator completed remaining work.)
- Orchestrator: ran `bun run db:push` (DB at db/custom.db), set .env to portable relative DATABASE_URL=file:../db/custom.db, wrote prisma/seed.mjs (8 specialties, 10 doctors, 15 patients, 40 appointments incl 8 today, 22 reviews w/ aggregates recomputed, 7 active + 3 completed tracking records, 20 beds across 5 wards, 4 health blogs), added "db:seed" script, deleted sample api/route.ts, ran seed
- Verified ALL endpoints with curl: GET lists/filters, POST creates (wrapped responses: {doctor},{patient},{appointment},{review},{record},{blog}), PATCH updates (appointment status, doctor availability, bed assignment, tracking advance), DELETE + cascade, 409 double-booking rejection, rating recompute after review POST/DELETE
- `bun run lint` passes clean

Stage Summary:
- API convention: list GETs → {doctors|patients|appointments|reviews|blogs|beds,wards|specialties|...records+stageCounts+queue+serverTime}; single GET/PATCH/POST → {doctor|patient|appointment|review|record|blog|bed}; DELETE → {success:true}; errors → {error} + status
- Tracking GET auto-advances patients through 6 stages by wall-clock time (deterministic durations), generates vitals at TRIAGE, computes room/stageProgress/waitMinutes/stages per record — frontend just polls every 3s
- All seed data verified; test entities cleaned up (back to exactly 10/15/40/22)

---
Task ID: 3-a
Agent: Orchestrator (Z.ai Code)
Task: Generate 18 real AI images for the project

Work Log:
- Fixed image size constraint (dimensions must be multiples of 32; 1440x720 → 1440x736)
- Ran batch generation via z-ai-web-dev-sdk (gen-images.mjs, deleted after use)
- Generated: hero-hospital.png, ambulance.png, wards/icu.png + general.png, doctors/doctor-1..10.png (South Asian physician portraits), blog/blog-1..4.png (health covers)
- Verified 18/18 generated successfully, all served via /images/* (HTTP 200)

Stage Summary:
- All 18 images used in UI: hero banner, dashboard emergency banner, 10 doctor cards/profiles, ward headers in tracking, 4 blog covers
- Images included in the final zip under public/images/

---
Task ID: 4
Agent: Orchestrator (Z.ai Code)
Task: Build the complete frontend (7 modules, header/hero/footer, theming)

Work Log:
- Created src/lib/api.ts — fully typed API client mirroring backend contract (all entities, fetchers, mutations, stage metadata)
- Created src/components/bdhospital/: shared.tsx (Stars, StarPicker, badges, avatars, StatCard, EmptyState, skeletons, time helpers), header.tsx (sticky nav w/ 7 tabs, dark-mode toggle, emergency 999, Project Zip download), hero.tsx (photo hero + student credit card), footer.tsx (sticky footer w/ student info)
- dashboard.tsx: 5 KPI cards (poll 5s), 7-day appointments area chart, specialty pie chart, LIVE hospital flow mini-board (poll 4s), top-rated doctors, latest reviews, bed occupancy, today's schedule strip, emergency/ambulance banner
- doctors.tsx: search + specialty filter, photo card grid, add/edit dialog (photo picker), profile dialog w/ reviews + rating distribution, WriteReviewDialog (shared), delete confirm
- patients.tsx: searchable registry table, register/edit dialog, profile dialog (appointments history, reviews given, live status), Check-In dialog (issues queue token w/ priority)
- appointments.tsx: status/date filters, booking dialog (slot graying for booked slots), status workflow buttons, "Send to Queue" hand-off to live tracking, delete
- reviews.tsx: avg + star-distribution summary, doctor filter, review wall w/ delete, write-review CTA
- tracking.tsx (flagship): LIVE header (pulsing dot, queue stats), 6-stage flow board with framer-motion animated patient cards (token, priority, progress, wait), record detail dialog (vitals grid, journey timeline, Advance/Complete actions), New Arrival check-in, ward & bed management (photo ward headers, occupancy bars, clickable beds w/ assign/discharge/clean)
- blogs.tsx: article grid w/ covers, reader dialog, publish dialog
- page.tsx: QueryClientProvider + tab composition; layout.tsx: BDHospital metadata, ThemeProvider (light/dark), Sonner toaster
- Fixed lint issues (set-state-in-effect → CSS-based theme toggle icon; missing imports; unused imports)

Stage Summary:
- Full SPA on "/" only — 7 modules all wired to the verified API contract
- Polling-based realtime (3s tracking / 5s stats) with live indicators
- Lint passes clean; no console/page errors (agent-browser verified)

---
Task ID: 5
Agent: Orchestrator (Z.ai Code)
Task: End-to-end browser verification (Agent Browser + VLM)

Work Log:
- Opened / in headless browser: title, hero, KPIs, charts, emergency banner all render; VLM quality 9/10
- Doctors tab: 10 cards with photos render (VLM 9/10); profile dialog shows reviews; searched & filtered
- Live Tracking: board renders with live data; verified REAL-TIME advancement (seed patients progressed through stages & completed over ~1h); tested Advance Stage action (T-101 REGISTRATION→PHARMACY w/ vitals generated); ward/bed grids render
- Appointments: booked Shirin Akter → Dr. Sadia Islam (ENT) 09:00 AM through the UI dialog — appeared in table as SCHEDULED
- Reviews: published 5★ review (Rokeya Begum → Dr. Sadia Islam) through the UI; verified DB + rating recompute (4.5 → 4.67, count 3); (initial failure was a test-automation stale-ref, not an app bug — role/keyboard-based selection verified working)
- Patients & Blogs tabs render; blog reader + publish dialogs present
- Dark mode: readable, high contrast; Mobile 390px: stacks correctly, no horizontal overflow
- Sticky footer: short page → sticks to viewport bottom exactly (stickyToBottom: true); long page → pushed naturally (no overlap)
- No page errors / console errors throughout; re-seeded DB for fresh live demo state

Stage Summary:
- Golden paths all verified working E2E in a real browser: browse → book → check-in → track live → review → rating updates
- App is interactive and runnable; ready for delivery

---
Task ID: 6
Agent: Orchestrator (Z.ai Code)
Task: Write project README + create BDHospital project zip deliverable

Work Log:
- Wrote comprehensive README.md (project overview, features, tech stack, architecture diagram, setup guide, scripts, DB schema, full REST API docs, project structure, credits — all in English, student info throughout)
- Staged clean project at /tmp/BDHospital: src, prisma (schema + seed), db/custom.db (pre-seeded), public (all 18 images), configs, .env (portable relative DB path), README
- Rewrote staged package.json: name "bdhospital" v1.0.0, author Imran Munshi (222-15-6376) DIU, portable scripts (plain next dev/build/start, db:generate/push/seed), removed unused deps (verified none imported)
- Simplified next.config.ts for portability (removed standalone output)
- Created public/BDHospital-project.zip (2.0 MB, 153 files): 18 images, 16 API route files, seeded DB, seed script, full docs — zip integrity verified OK
- Verified download from running app: HTTP 200, correct size, extracts cleanly; header "Project Zip" button serves it

Stage Summary:
- Deliverable ready: BDHospital-project.zip downloadable from the app header ("Project Zip" button) or /BDHospital-project.zip
- Zip runs with: npm install → npm run db:generate → npm run dev (DB pre-seeded; re-seed via npm run db:seed)
- Final state: lint clean, dev server healthy, all modules browser-verified
