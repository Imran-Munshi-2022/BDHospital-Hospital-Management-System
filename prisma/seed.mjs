// BDHospital — Database Seed Script
// Web Engineering Lab CSE416 — Imran Munshi (222-15-6376), Daffodil International University
//
// Runs with:  bun prisma/seed.mjs   (or)   node prisma/seed.mjs
// Idempotent: wipes all tables and recreates a complete, realistic dataset.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const pad = (n) => String(n).padStart(2, "0");
const toDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const minutesAgo = (n) => new Date(Date.now() - n * 60000);

const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM",
];

async function main() {
  console.log("🌱 Seeding BDHospital database...");

  // ---- Wipe (FK-safe order) -------------------------------------------------
  await prisma.review.deleteMany();
  await prisma.trackingRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.specialty.deleteMany();
  console.log("   ✓ Cleared existing data");

  // ---- Specialties ----------------------------------------------------------
  const specialties = await Promise.all(
    [
      ["Cardiology", "Diagnosis and treatment of heart and blood vessel conditions.", "HeartPulse"],
      ["Neurology", "Care for the brain, spinal cord, nerves and neurological disorders.", "Brain"],
      ["Orthopedics", "Bones, joints, ligaments and musculoskeletal surgery.", "Bone"],
      ["Pediatrics", "Medical care for infants, children and adolescents.", "Baby"],
      ["Dermatology", "Skin, hair and nail health and disease management.", "Sparkles"],
      ["Gynecology & Obstetrics", "Women's reproductive health, pregnancy and childbirth care.", "Heart"],
      ["Gastroenterology", "Digestive system, liver and gastrointestinal care.", "Activity"],
      ["ENT", "Ear, nose, throat, head and neck specialist care.", "Ear"],
    ].map(([name, description, icon], i) =>
      prisma.specialty.create({ data: { id: i + 1, name, description, icon } })
    )
  );

  // ---- Doctors ---------------------------------------------------------------
  const doctorData = [
    { fullName: "Dr. Ahmed Hasan", email: "ahmed.hasan@bdhospital.com.bd", phone: "+8801711000101", gender: "Male", designation: "Senior Cardiologist", specialtyId: 1, photo: "/images/doctors/doctor-1.png", experienceYears: 22, consultationFee: 1500, bio: "MBBS, MD (Cardiology). One of Bangladesh's most experienced interventional cardiologists with over 5,000 angioplasties performed. Formerly head of cardatology at BSMMU." },
    { fullName: "Dr. Farhana Rahman", email: "farhana.rahman@bdhospital.com.bd", phone: "+8801711000102", gender: "Female", designation: "Pediatrician", specialtyId: 4, photo: "/images/doctors/doctor-2.png", experienceYears: 8, consultationFee: 800, bio: "MBBS, FCPS (Pediatrics). Passionate about child health, vaccination programs and newborn care. Known for her friendly approach with young patients and parents." },
    { fullName: "Dr. Mahmudul Karim", email: "mahmudul.karim@bdhospital.com.bd", phone: "+8801711000103", gender: "Male", designation: "Consultant Neurologist", specialtyId: 2, photo: "/images/doctors/doctor-3.png", experienceYears: 15, consultationFee: 1200, bio: "MBBS, MD (Neurology). Specializes in stroke management, epilepsy and movement disorders. Leads BDHospital's dedicated stroke unit." },
    { fullName: "Dr. Nusrat Jahan", email: "nusrat.jahan@bdhospital.com.bd", phone: "+8801711000104", gender: "Female", designation: "Consultant Dermatologist", specialtyId: 5, photo: "/images/doctors/doctor-4.png", experienceYears: 11, consultationFee: 900, bio: "MBBS, DDV (Dermatology). Expert in clinical dermatology, cosmetic procedures and skin allergy management." },
    { fullName: "Dr. Rajib Chowdhury", email: "rajib.chowdhury@bdhospital.com.bd", phone: "+8801711000105", gender: "Male", designation: "Orthopedic Surgeon", specialtyId: 3, photo: "/images/doctors/doctor-5.png", experienceYears: 9, consultationFee: 1100, bio: "MBBS, MS (Orthopedics). Sports injury specialist performing arthroscopic and joint replacement surgery." },
    { fullName: "Dr. Shamima Akter", email: "shamima.akter@bdhospital.com.bd", phone: "+8801711000106", gender: "Female", designation: "Consultant Gynecologist", specialtyId: 6, photo: "/images/doctors/doctor-6.png", experienceYears: 14, consultationFee: 1000, bio: "MBBS, FCPS (Gynae & Obs). High-risk pregnancy care, infertility treatment and minimally invasive gynecological surgery." },
    { fullName: "Dr. Tanvir Alam", email: "tanvir.alam@bdhospital.com.bd", phone: "+8801711000107", gender: "Male", designation: "Consultant Gastroenterologist", specialtyId: 7, photo: "/images/doctors/doctor-7.png", experienceYears: 12, consultationFee: 1050, bio: "MBBS, MD (Gastroenterology). Endoscopy and colonoscopy expert treating liver disease, IBS and acid reflux disorders." },
    { fullName: "Dr. Sadia Islam", email: "sadia.islam@bdhospital.com.bd", phone: "+8801711000108", gender: "Female", designation: "ENT Specialist", specialtyId: 8, photo: "/images/doctors/doctor-8.png", experienceYears: 7, consultationFee: 850, bio: "MBBS, DLO (ENT). Treats sinus disease, hearing loss and performs tonsil and ENT surgeries." },
    { fullName: "Dr. Kamrul Hasan", email: "kamrul.hasan@bdhospital.com.bd", phone: "+8801711000109", gender: "Male", designation: "Cardiac Surgeon", specialtyId: 1, photo: "/images/doctors/doctor-9.png", experienceYears: 18, consultationFee: 1600, bio: "MBBS, MS (CVTS). Open-heart and bypass surgery specialist trained in the UK. Heads BDHospital's cardiac surgery team.", isAvailable: false },
    { fullName: "Dr. Rokeya Sultana", email: "rokeya.sultana@bdhospital.com.bd", phone: "+8801711000110", gender: "Female", designation: "Pediatrician", specialtyId: 4, photo: "/images/doctors/doctor-10.png", experienceYears: 6, consultationFee: 750, bio: "MBBS, FCPS (Pediatrics). Focused on childhood asthma, nutrition and developmental pediatrics.", isAvailable: false },
  ];
  const doctors = [];
  for (let i = 0; i < doctorData.length; i++) {
    const d = doctorData[i];
    doctors.push(
      await prisma.doctor.create({
        data: { id: i + 1, ...d, isAvailable: d.isAvailable !== false },
      })
    );
  }

  // ---- Patients --------------------------------------------------------------
  const patientData = [
    ["Karim Uddin", "karim.uddin@gmail.com", "+8801811000201", "Male", 58, "B+", "House 12, Road 5, Dhanmondi, Dhaka", "INS-2023-0451"],
    ["Rokeya Begum", "rokeya.begum@gmail.com", "+8801811000202", "Female", 45, "O+", "Village: Charpara, Mymensingh", null],
    ["Jahangir Alam", "jahangir.alam@gmail.com", "+8801811000203", "Male", 36, "A+", "Flat 4B, Uttara Sector 7, Dhaka", "INS-2022-0187"],
    ["Shirin Akter", "shirin.akter@gmail.com", "+8801811000204", "Female", 29, "AB+", "House 45, Mirpur DOHS, Dhaka", null],
    ["Mizanur Rahman", "mizanur.rahman@gmail.com", "+8801811000205", "Male", 63, "O-", "Zindabazar Point, Sylhet", "INS-2024-0033"],
    ["Parvin Sultana", "parvin.sultana@gmail.com", "+8801811000206", "Female", 52, "B-", "Agrabad Badam Bagicha, Chattogram", null],
    ["Arif Hossain", "arif.hossain@gmail.com", "+8801811000207", "Male", 24, "A-", "Kazla New Market Road, Rajshahi", null],
    ["Salma Khatun", "salma.khatun@gmail.com", "+8801811000208", "Female", 33, "O+", "House 8, Zigatola, Dhaka", "INS-2023-0920"],
    ["Rafiq Islam", "rafiq.islam@gmail.com", "+8801811000209", "Male", 47, "B+", "Station Road, Bogura", null],
    ["Nasrin Ahmed", "nasrin.ahmed@gmail.com", "+8801811000210", "Female", 26, "A+", "Banani Block C, Dhaka", null],
    ["Habibur Rahman", "habibur.rahman@gmail.com", "+8801811000211", "Male", 70, "O+", "Chawkbazar, Old Dhaka", "INS-2021-0566"],
    ["Jesmin Begum", "jesmin.begum@gmail.com", "+8801811000212", "Female", 38, "AB-", "Shibbari More, Khulna", null],
    ["Shahin Alam", "shahin.alam@gmail.com", "+8801811000213", "Male", 19, "B+", "Jamalkhan, Chattogram", null],
    ["Momena Begum", "momena.begum@gmail.com", "+8801811000214", "Female", 61, "A+", "Uttar Badda, Dhaka", "INS-2024-0148"],
    ["Delwar Hossain", "delwar.hossain@gmail.com", "+8801811000215", "Male", 8, "O+", "Guard: Nurul Islam, Basabo, Dhaka", null],
  ];
  const patients = [];
  for (let i = 0; i < patientData.length; i++) {
    const [fullName, email, phone, gender, age, bloodGroup, address, insuranceId] = patientData[i];
    patients.push(
      await prisma.patient.create({
        data: { id: i + 1, fullName, email, phone, gender, age, bloodGroup, address, insuranceId },
      })
    );
  }

  // ---- Appointments (last 7 days, all statuses, some today) -------------------
  const today = toDateString(new Date());
  const day = (n) => toDateString(dateDaysAgo(n));
  // [doctorIdx, patientIdx, daysAgo, slotIdx, reason, status, notes]
  const appointmentPlan = [
    [0, 0, 6, 0, "Chest pain and shortness of breath follow-up", "COMPLETED", "ECG normal. Medication adjusted."],
    [0, 4, 6, 3, "Hypertension routine review", "COMPLETED", null],
    [1, 14, 6, 1, "Fever and cough for 3 days", "COMPLETED", "Seasonal flu. Prescribed rest."],
    [2, 10, 5, 2, "Recurrent migraine attacks", "COMPLETED", "MRI advised if pain persists."],
    [3, 7, 5, 4, "Skin rash and itching on arms", "COMPLETED", "Allergic reaction identified."],
    [4, 2, 5, 5, "Lower back pain after lifting", "COMPLETED", null],
    [5, 3, 4, 0, "Antenatal check-up (2nd trimester)", "COMPLETED", "Mother and baby healthy."],
    [6, 8, 4, 3, "Acid reflux and stomach pain", "COMPLETED", "Endoscopy scheduled."],
    [7, 6, 4, 2, "Ear pain and mild hearing difficulty", "COMPLETED", null],
    [1, 13, 3, 1, "Child vaccination (MMR booster)", "COMPLETED", null],
    [0, 5, 3, 6, "Palpitations while walking", "COMPLETED", "Holter monitoring done."],
    [5, 11, 3, 4, "Irregular menstrual cycle consultation", "CANCELLED", "Patient rescheduled."],
    [2, 12, 2, 5, "Numbness in left hand", "COMPLETED", null],
    [4, 9, 2, 0, "Knee pain while climbing stairs", "COMPLETED", "X-ray shows early arthritis."],
    [6, 0, 2, 1, "Colonoscopy follow-up discussion", "COMPLETED", null],
    [3, 1, 1, 2, "Fungal skin infection review", "COMPLETED", null],
    [7, 14, 1, 5, "Tonsil infection re-check", "COMPLETED", "Recovery on track."],
    [5, 3, 1, 6, "Antenatal growth scan review", "CONFIRMED", null],
    [0, 10, 0, 0, "Angina follow-up and ECG review", "CONFIRMED", "Patient arriving at 9 AM."],
    [1, 14, 0, 1, "Fever re-check after medication", "CONFIRMED", null],
    [2, 12, 0, 3, "Nerve conduction test discussion", "SCHEDULED", null],
    [4, 2, 0, 5, "Physiotherapy progress review", "SCHEDULED", null],
    [6, 8, 0, 6, "Endoscopy result consultation", "SCHEDULED", null],
    [3, 7, 0, 2, "Acne treatment follow-up", "SCHEDULED", null],
    [0, 5, 1, 6, "Blood pressure monitoring review", "CANCELLED", "Patient travelled abroad."],
    [5, 11, 6, 2, "Pregnancy confirmation visit", "COMPLETED", null],
    [7, 6, 5, 1, "Sinusitis consultation", "COMPLETED", null],
    [1, 13, 4, 5, "Growth and nutrition assessment", "COMPLETED", null],
    [4, 9, 6, 2, "Shoulder pain assessment", "CANCELLED", null],
    [2, 10, 1, 0, "Dizziness and balance issues", "CONFIRMED", null],
    [6, 4, 1, 3, "Fatty liver dietary counselling", "SCHEDULED", null],
    [3, 1, 2, 6, "Eczema flare-up treatment", "COMPLETED", null],
    [0, 0, 2, 1, "Post-angioplasty routine review", "COMPLETED", "Stent functioning well."],
    [5, 3, 2, 4, "Antenatal class referral", "CANCELLED", null],
    [7, 14, 3, 6, "Ear wax removal and check", "COMPLETED", null],
    [1, 9, 3, 0, "Recurrent tonsillitis evaluation", "COMPLETED", null],
    [4, 6, 1, 1, "Wrist sprain re-check", "SCHEDULED", null],
    [2, 4, 0, 7, "Stroke prevention medication review", "SCHEDULED", null],
    [6, 12, 0, 4, "Chronic gastritis management", "SCHEDULED", null],
    [3, 13, 4, 3, "Skin allergy patch testing", "COMPLETED", null],
  ];
  const appointments = [];
  for (let i = 0; i < appointmentPlan.length; i++) {
    const [dIdx, pIdx, daysAgo, slotIdx, reason, status, notes] = appointmentPlan[i];
    const date = day(daysAgo);
    appointments.push(
      await prisma.appointment.create({
        data: {
          id: i + 1,
          doctorId: doctors[dIdx].id,
          patientId: patients[pIdx].id,
          date,
          timeSlot: TIME_SLOTS[slotIdx],
          reason,
          status,
          notes,
          createdAt: dateDaysAgo(daysAgo),
        },
      })
    );
  }
  // today's appointments use today's date explicitly
  const todayCount = appointments.filter((a) => a.date === today).length;

  // ---- Reviews ----------------------------------------------------------------
  // [doctorIdx, patientIdx, rating, comment, daysAgo]
  const reviewPlan = [
    [0, 0, 5, "Dr. Ahmed Hasan saved my life. His quick decision during my heart attack and the angioplasty afterwards were flawless. He explains everything with great patience.", 5],
    [0, 4, 5, "Very experienced cardiologist. He reviewed my full history carefully and adjusted my BP medicines. Waiting time was a bit long but totally worth it.", 4],
    [0, 5, 4, "Excellent doctor, very thorough with tests. The cabin was busy but the staff managed the queue well.", 2],
    [0, 10, 5, "Post-angioplasty care was outstanding. He personally called to check on my recovery. Rare dedication these days.", 1],
    [1, 14, 5, "My son is usually terrified of doctors, but Dr. Farhana handled him so gently. The vaccination was over before he even noticed!", 4],
    [1, 13, 4, "Very caring pediatrician. Gave us a clear nutrition chart for my daughter. Cabin could be bigger for kids though.", 3],
    [1, 9, 5, "Best child specialist in this area. She diagnosed my tonsillitis issue that others kept missing.", 2],
    [2, 10, 5, "Dr. Mahmudul Karim is brilliant. His migraine diagnosis and treatment plan changed my daily life. Highly recommended.", 5],
    [2, 12, 4, "Great neurologist, very methodical. He ordered only the necessary tests instead of a long expensive list.", 3],
    [2, 4, 3, "Knowledgeable doctor but I had to wait almost 40 minutes past my slot. Treatment itself was effective.", 2],
    [3, 7, 5, "My skin rash that lasted months was cured in two weeks under Dr. Nusrat's treatment. She is very kind and precise.", 5],
    [3, 1, 4, "Good dermatologist, explained the allergy triggers clearly. Follow-up instructions were detailed and helpful.", 3],
    [3, 13, 5, "Professional and friendly. The patch testing process was smooth and the results were well explained.", 2],
    [4, 2, 5, "Dr. Rajib is an excellent orthopedic surgeon. My back pain treatment and physiotherapy plan worked within weeks.", 4],
    [4, 9, 4, "Very skilled surgeon with a practical approach. Knee injection was nearly painless. Slightly rushed consultation.", 3],
    [5, 3, 5, "Dr. Shamima made my first pregnancy journey completely stress-free. She is always available for questions and very reassuring.", 5],
    [5, 11, 4, "Caring gynecologist and clear communicator. The clinic is busy on weekends, book early slots.", 4],
    [6, 8, 5, "Dr. Tanvir Alam's endoscopy was completely comfortable and his dietary advice fixed my reflux in a month.", 3],
    [6, 4, 4, "Detailed consultation about my fatty liver. He genuinely listens instead of rushing. Follow-up plan was clear.", 2],
    [6, 0, 5, "Excellent gastroenterologist. Explained the colonoscopy results with diagrams until everything was clear.", 1],
    [7, 6, 4, "Very good ENT specialist. My sinusitis is finally under control after years of suffering.", 4],
    [7, 14, 5, "Dr. Sadia handled my son's ear infection very professionally. Quick recovery, no unnecessary medicines.", 2],
  ];
  for (const [dIdx, pIdx, rating, comment, daysAgo] of reviewPlan) {
    await prisma.review.create({
      data: {
        doctorId: doctors[dIdx].id,
        patientId: patients[pIdx].id,
        rating,
        comment,
        createdAt: dateDaysAgo(daysAgo),
      },
    });
  }
  // Recompute doctor aggregates
  for (const doctor of doctors) {
    const agg = await prisma.review.aggregate({
      where: { doctorId: doctor.id },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        rating: agg._avg.rating ? Math.round(agg._avg.rating * 100) / 100 : 0,
        reviewCount: agg._count,
      },
    });
  }

  // ---- Tracking records (live patient flow) -----------------------------------
  // 7 ACTIVE at varied stages (entered minutes ago so movement is visible immediately)
  const minutesA = (m) => new Date(Date.now() - m * 60000).toISOString();
  const activeTrackingPlan = [
    // [patientIdx, appointmentIdx|null, stage, minutesInStage, priority, history]
    [0, 18, "REGISTRATION", 2, "URGENT", []], // Karim Uddin — angina follow-up
    [14, 19, "REGISTRATION", 1, "NORMAL", []], // Delwar Hossain — fever re-check
    [7, 23, "TRIAGE", 3, "NORMAL", [{ stage: "REGISTRATION", enteredAt: minutesA(9), durationMin: 5 }]], // Salma Khatun
    [10, null, "CONSULTATION", 5, "EMERGENCY", [{ stage: "REGISTRATION", enteredAt: minutesA(24), durationMin: 4 }, { stage: "TRIAGE", enteredAt: minutesA(20), durationMin: 6 }]], // Habibur Rahman
    [3, 17, "CONSULTATION", 8, "NORMAL", [{ stage: "REGISTRATION", enteredAt: minutesA(28), durationMin: 5 }, { stage: "TRIAGE", enteredAt: minutesA(23), durationMin: 7 }]], // Shirin Akter — antenatal
    [8, 22, "DIAGNOSTICS", 4, "NORMAL", [{ stage: "REGISTRATION", enteredAt: minutesA(31), durationMin: 4 }, { stage: "TRIAGE", enteredAt: minutesA(27), durationMin: 5 }, { stage: "CONSULTATION", enteredAt: minutesA(22), durationMin: 10 }]], // Rafiq Islam
    [2, 21, "PHARMACY", 2, "NORMAL", [{ stage: "REGISTRATION", enteredAt: minutesA(36), durationMin: 5 }, { stage: "TRIAGE", enteredAt: minutesA(31), durationMin: 6 }, { stage: "CONSULTATION", enteredAt: minutesA(25), durationMin: 9 }, { stage: "DIAGNOSTICS", enteredAt: minutesA(16), durationMin: 8 }]], // Jahangir Alam
  ];
  let token = 101;
  const trackingPlan = [];
  for (const [pIdx, aIdx, currentStage, minutesInStage, priority, history] of activeTrackingPlan) {
    trackingPlan.push({
      patientId: patients[pIdx].id,
      appointmentId: aIdx === null ? null : appointments[aIdx].id,
      tokenNumber: `T-${String(token++).padStart(3, "0")}`,
      currentStage,
      stageEnteredAt: minutesAgo(minutesInStage),
      priority,
      status: "ACTIVE",
      history: JSON.stringify(history),
      vitals: ["TRIAGE", "CONSULTATION", "DIAGNOSTICS", "PHARMACY", "CHECKOUT"].includes(currentStage)
        ? JSON.stringify({ bp: "122/80", pulse: 78, temp: "98.4", spo2: 98 })
        : null,
      createdAt: minutesAgo(minutesInStage + 30),
    });
  }
  // 3 COMPLETED today
  const completedTrackingPlan = [
    [5, 10, "COMPLETED", [{ stage: "REGISTRATION", enteredAt: minutesA(95), durationMin: 4 }, { stage: "TRIAGE", enteredAt: minutesA(91), durationMin: 5 }, { stage: "CONSULTATION", enteredAt: minutesA(86), durationMin: 8 }, { stage: "DIAGNOSTICS", enteredAt: minutesA(78), durationMin: 9 }, { stage: "PHARMACY", enteredAt: minutesA(69), durationMin: 4 }, { stage: "CHECKOUT", enteredAt: minutesA(65), durationMin: 3 }]],
    [13, 6, "COMPLETED", [{ stage: "REGISTRATION", enteredAt: minutesA(140), durationMin: 5 }, { stage: "TRIAGE", enteredAt: minutesA(135), durationMin: 6 }, { stage: "CONSULTATION", enteredAt: minutesA(129), durationMin: 11 }, { stage: "DIAGNOSTICS", enteredAt: minutesA(118), durationMin: 12 }, { stage: "PHARMACY", enteredAt: minutesA(106), durationMin: 5 }, { stage: "CHECKOUT", enteredAt: minutesA(101), durationMin: 4 }]],
    [12, 7, "COMPLETED", [{ stage: "REGISTRATION", enteredAt: minutesA(180), durationMin: 3 }, { stage: "TRIAGE", enteredAt: minutesA(177), durationMin: 4 }, { stage: "CONSULTATION", enteredAt: minutesA(173), durationMin: 7 }, { stage: "PHARMACY", enteredAt: minutesA(166), durationMin: 3 }, { stage: "CHECKOUT", enteredAt: minutesA(163), durationMin: 2 }]],
  ];
  for (const [pIdx, aIdx, status, history] of completedTrackingPlan) {
    const last = history[history.length - 1];
    trackingPlan.push({
      patientId: patients[pIdx].id,
      appointmentId: appointments[aIdx].id,
      tokenNumber: `T-${String(token++).padStart(3, "0")}`,
      currentStage: "CHECKOUT",
      stageEnteredAt: new Date(last.enteredAt),
      priority: "NORMAL",
      status,
      history: JSON.stringify(history),
      vitals: JSON.stringify({ bp: "118/76", pulse: 72, temp: "98.1", spo2: 99 }),
      createdAt: minutesAgo(190),
    });
  }
  for (const data of trackingPlan) {
    await prisma.trackingRecord.create({ data });
  }

  // ---- Beds --------------------------------------------------------------------
  const bedPlan = [
    // [ward, count, occupiedPatientIdxs[], cleaningBedNumbers[]]
    ["ICU", 4, [0, 4, 10], []],
    ["GENERAL", 8, [2, 5, 8, 9, 13], ["GEN-08"]],
    ["EMERGENCY", 4, [3, 6], []],
    ["MATERNITY", 2, [11], []],
    ["PEDIATRIC", 2, [14], []],
  ];
  for (const [ward, count, occupiedIdxs, cleaning] of bedPlan) {
    const prefix = ward === "ICU" ? "ICU" : ward === "GENERAL" ? "GEN" : ward === "EMERGENCY" ? "EMG" : ward === "MATERNITY" ? "MAT" : "PED";
    for (let i = 1; i <= count; i++) {
      const bedNumber = `${prefix}-${String(i).padStart(2, "0")}`;
      const occupiedBy = occupiedIdxs[i - 1];
      const isCleaning = cleaning.includes(bedNumber);
      await prisma.bed.create({
        data: {
          ward,
          bedNumber,
          status: occupiedBy !== undefined ? "OCCUPIED" : isCleaning ? "CLEANING" : "AVAILABLE",
          patientId: occupiedBy !== undefined ? patients[occupiedBy].id : null,
        },
      });
    }
  }

  // ---- Blogs --------------------------------------------------------------------
  const blogPlan = [
    {
      title: "Heart Health: 7 Habits That Protect Your Cardiovascular System",
      summary: "Small daily choices — from salt intake to sleep quality — dramatically reduce your risk of heart disease, Bangladesh's leading cause of death.",
      category: "Cardiology",
      coverImage: "/images/blog/blog-1.png",
      authorId: doctors[0].id,
      views: 284,
      daysAgo: 21,
      content: "Heart disease remains the number one cause of death in Bangladesh, accounting for nearly one in four deaths every year. The encouraging news is that most cardiovascular disease is preventable through consistent, modest lifestyle changes.\n\nFirst, watch your salt. The average Bangladeshi diet contains far more sodium than the recommended 5 grams of salt per day — much of it hidden in pickles, sauces and processed snacks. High salt intake directly raises blood pressure, the single largest risk factor for stroke and heart attack.\n\nSecond, stay active. Just 30 minutes of brisk walking five days a week lowers blood pressure, improves cholesterol and helps maintain a healthy weight. If you work a desk job, set a reminder to stand and move for five minutes every hour.\n\nThird, quit tobacco in every form. Within just one year of quitting, your risk of heart disease falls to half that of a smoker. Fourth, manage stress — chronic stress raises blood pressure and promotes unhealthy coping habits.\n\nFinally, know your numbers. Everyone above 30 should check blood pressure yearly and blood sugar and cholesterol at least every two years. Early detection turns a potential emergency into a manageable condition. If you experience chest discomfort, breathlessness or unexplained sweating, do not wait — come to the emergency department immediately.",
    },
    {
      title: "Diabetes-Friendly Bangladeshi Diet: What to Eat and What to Limit",
      summary: "Managing blood sugar doesn't mean giving up rice and traditional food — it means understanding portions, pairing and timing.",
      category: "Nutrition",
      coverImage: "/images/blog/blog-2.png",
      authorId: doctors[6].id,
      views: 197,
      daysAgo: 14,
      content: "With over 13 million adults living with diabetes, Bangladesh faces one of the fastest-growing diabetes epidemics in South Asia. The good news? Blood sugar control starts in your own kitchen.\n\nRice is not the enemy — portion size is. A practical rule is to keep cooked rice to about one cup per meal and to pair it with plenty of vegetables, dal and a source of protein like fish or chicken. Protein and fiber slow down glucose absorption and prevent the sharp spikes after meals.\n\nEmbrace vegetables. Shak (leafy greens), lau, jhinga, korola and bhendi are low in calories and rich in fiber. Fill half your plate with vegetables before serving rice. Choose whole fruit over juice — the fiber in a whole apple or guava blunts its sugar effect, while juice acts almost like plain sugar.\n\nLimit the obvious and hidden sugars: sweets, soft drinks, and also sweetened yogurt and packaged juices. Watch fried snacks — singara and puri add both calories and refined carbohydrates.\n\nTiming matters too. Eating meals at consistent times, and taking a 10–15 minute walk after lunch and dinner, can lower post-meal blood sugar by up to 20 percent. If you are above 35, overweight, or have a family history, get your fasting blood sugar checked yearly. Early prediabetes can be reversed — established diabetes can only be managed.",
    },
    {
      title: "Your Child's First Five Years: A Vaccination and Growth Guide for Parents",
      summary: "A practical walkthrough of the essential vaccines, growth milestones and warning signs every Bangladeshi parent should know.",
      category: "Child Care",
      coverImage: "/images/blog/blog-3.png",
      authorId: doctors[1].id,
      views: 342,
      daysAgo: 9,
      content: "The first five years of life shape a child's lifelong health. As a pediatrician, the questions parents ask me most are about vaccines and growth — so here is a simple, practical guide.\n\nVaccination is the single most powerful protection you can give your child. Bangladesh's EPI (Expanded Programme on Immunization) schedule is free and world-class: BCG at birth, five visits for pentavalent and polio vaccines through 18 months, and the MR vaccine at 9 and 15 months. Never skip a dose — an incomplete series leaves windows of vulnerability. Keep the card safe and bring it to every visit.\n\nGrowth is your child's report card of nutrition. In the first year, babies typically triple their birth weight; from age two they gain about 2 kg per year. Regular weighing and plotting on a growth chart matters more than any single measurement. A child crossing weight or height percentiles downward needs evaluation.\n\nMilestones matter too: social smile by 6–8 weeks, sitting by 6–8 months, walking by 12–15 months and first words by 12–18 months. If something feels delayed, seek advice early — early intervention for speech or developmental delay works best before age three.\n\nWarning signs that need immediate medical attention: fever in a baby under three months, refusal to feed, unusually sleepy or irritable behavior, fast breathing, or a rash that doesn't fade when pressed. Trust your instincts — a parent's sense that something is wrong is often right.",
    },
    {
      title: "Mind Matters: Recognizing and Managing Stress, Anxiety and Low Mood",
      summary: "Mental health is real health. Learn the signs that deserve attention and simple, evidence-based ways to protect your mind.",
      category: "Mental Health",
      coverImage: "/images/blog/blog-4.png",
      authorId: doctors[3].id,
      views: 156,
      daysAgo: 3,
      content: "We routinely seek help for a fever or a broken bone, yet many of us suffer quietly with stress, anxiety and depression — conditions that are just as real and far more common. In Bangladesh, an estimated 16 percent of adults experience a mental health condition in their lifetime, and most never receive care.\n\nRecognize the signs. Persistent worry that you cannot switch off, sleep that no longer refreshes you, loss of interest in things you used to enjoy, unexplained aches and pains, irritability, and difficulty concentrating for more than two weeks — these are signals, not weaknesses, and they deserve attention.\n\nProtect your mind daily. Sleep is the foundation — seven to eight hours at consistent times regulates mood, memory and even immunity. Movement is medicine: 30 minutes of moderate exercise three to five times a week has been shown to reduce mild-to-moderate depression as effectively as some medications. Limit late-night scrolling; blue light and stressful news feed insomnia.\n\nPractice the pause. Simple breathing exercises — inhale for four counts, hold for four, exhale for six — activate the body's relaxation response within minutes. Stay connected: sharing your feelings with a trusted friend or family member genuinely lowers stress hormones.\n\nSeek help without shame. Just as you would see a doctor for diabetes, a psychologist or psychiatrist can treat anxiety and depression with talking therapy, medication, or both — with excellent outcomes. At BDHospital, our mental health consultations are confidential and judgment-free. Taking care of your mind is one of the wisest investments you will ever make.",
    },
  ];
  for (const blog of blogPlan) {
    await prisma.blog.create({
      data: {
        title: blog.title,
        summary: blog.summary,
        content: blog.content,
        category: blog.category,
        coverImage: blog.coverImage,
        authorId: blog.authorId,
        views: blog.views,
        publishedAt: dateDaysAgo(blog.daysAgo),
      },
    });
  }

  const summary = {
    specialties: specialties.length,
    doctors: doctors.length,
    patients: patients.length,
    appointments: appointments.length,
    todayAppointments: todayCount,
    reviews: reviewPlan.length,
    trackingActive: activeTrackingPlan.length,
    trackingCompleted: completedTrackingPlan.length,
    beds: 20,
    blogs: blogPlan.length,
  };
  console.log("   ✓ Seed data created:", JSON.stringify(summary, null, 2));
  console.log("🌱 Seeding complete. Open the app to explore BDHospital.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
