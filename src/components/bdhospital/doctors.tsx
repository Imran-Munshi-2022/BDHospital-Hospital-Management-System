"use client";

// BDHospital — doctors directory: search, filter, CRUD, profile with reviews
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Search, UserPlus, Stethoscope, Pencil, Trash2, Eye, Mail, Phone, BadgeCheck, Star, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  fetchDoctors, fetchSpecialties, fetchReviews, fetchPatients, createDoctor, updateDoctor, deleteDoctor, createReview,
  DOCTOR_PHOTOS, type Doctor, type Review,
} from "@/lib/api";
import { Stars, StarPicker, EmptyState, CardSkeleton, timeAgo, StatusBadge } from "./shared";

// ---------------------------------------------------------------- Doctor form

type DoctorForm = {
  fullName: string; email: string; phone: string; gender: string; designation: string;
  specialtyId: string; bio: string; experienceYears: string; consultationFee: string;
  photo: string; isAvailable: boolean;
};

const emptyForm: DoctorForm = {
  fullName: "", email: "", phone: "", gender: "Male", designation: "",
  specialtyId: "", bio: "", experienceYears: "5", consultationFee: "800",
  photo: DOCTOR_PHOTOS[0], isAvailable: true,
};

function DoctorFormDialog({
  open, onClose, editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Doctor | null;
}) {
  const qc = useQueryClient();
  const specialties = useQuery({ queryKey: ["specialties"], queryFn: fetchSpecialties });
  const [form, setForm] = useState<DoctorForm>(emptyForm);
  const [initialized, setInitialized] = useState(false);

  // Reset form when dialog opens
  if (open && !initialized) {
    setInitialized(true);
    setForm(
      editing
        ? {
            fullName: editing.fullName, email: editing.email, phone: editing.phone,
            gender: editing.gender, designation: editing.designation,
            specialtyId: String(editing.specialtyId), bio: editing.bio,
            experienceYears: String(editing.experienceYears),
            consultationFee: String(editing.consultationFee),
            photo: editing.photo, isAvailable: editing.isAvailable,
          }
        : emptyForm
    );
  }
  if (!open && initialized) setInitialized(false);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        fullName: form.fullName, email: form.email, phone: form.phone, gender: form.gender,
        designation: form.designation, specialtyId: Number(form.specialtyId), bio: form.bio,
        experienceYears: Number(form.experienceYears) || 0,
        consultationFee: Number(form.consultationFee) || 0,
        photo: form.photo, isAvailable: form.isAvailable,
      };
      return editing ? updateDoctor(editing.id, payload) : createDoctor(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["specialties"] });
      toast.success(editing ? "Doctor profile updated" : `${form.fullName} joined the team`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof DoctorForm>(key: K, value: DoctorForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Doctor Profile" : "Add New Doctor"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the doctor's professional details." : "Register a new specialist physician at BDHospital."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="d-name">Full Name *</Label>
            <Input id="d-name" placeholder="Dr. Full Name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-designation">Designation *</Label>
            <Input id="d-designation" placeholder="e.g. Senior Cardiologist" value={form.designation} onChange={(e) => set("designation", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-email">Email *</Label>
            <Input id="d-email" type="email" placeholder="doctor@bdhospital.com.bd" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-phone">Phone *</Label>
            <Input id="d-phone" placeholder="+8801XXXXXXXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Specialty *</Label>
            <Select value={form.specialtyId} onValueChange={(v) => set("specialtyId", v)}>
              <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
              <SelectContent>
                {(specialties.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-exp">Experience (years)</Label>
            <Input id="d-exp" type="number" min={0} value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-fee">Consultation Fee (BDT)</Label>
            <Input id="d-fee" type="number" min={0} value={form.consultationFee} onChange={(e) => set("consultationFee", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="d-bio">Professional Bio</Label>
            <Textarea id="d-bio" rows={3} placeholder="Degrees, expertise, achievements…" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Profile Photo</Label>
            <div className="flex flex-wrap gap-2">
              {DOCTOR_PHOTOS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("photo", p)}
                  aria-label={`Select photo ${p}`}
                  className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 transition-all ${
                    form.photo === p ? "border-emerald-600 ring-2 ring-emerald-600/30" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={p} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Currently Available</p>
              <p className="text-xs text-muted-foreground">Show this doctor as available for appointments</p>
            </div>
            <Switch checked={form.isAvailable} onCheckedChange={(v) => set("isAvailable", v)} aria-label="Toggle availability" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={mutation.isPending || !form.fullName || !form.email || !form.designation || !form.specialtyId}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 size={15} className="mr-1 animate-spin" aria-hidden />}
            {editing ? "Save Changes" : "Add Doctor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------- Review writing

function WriteReviewDialog({ open, onClose, fixedDoctorId }: { open: boolean; onClose: () => void; fixedDoctorId?: number }) {
  const qc = useQueryClient();
  const doctors = useQuery({ queryKey: ["doctors", ""], queryFn: () => fetchDoctors() });
  const patients = useQuery({ queryKey: ["patients", ""], queryFn: () => fetchPatients() });
  const [doctorId, setDoctorId] = useState<string>("");
  const [patientId, setPatientId] = useState<string>("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [init, setInit] = useState(false);

  if (open && !init) {
    setInit(true);
    setDoctorId(fixedDoctorId ? String(fixedDoctorId) : "");
    setPatientId(""); setRating(5); setComment("");
  }
  if (!open && init) setInit(false);

  const mutation = useMutation({
    mutationFn: () => createReview({ doctorId: Number(doctorId), patientId: Number(patientId), rating, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Thank you! Your review has been published.");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Star size={17} className="text-amber-500" aria-hidden /> Write a Review</DialogTitle>
          <DialogDescription>Share your care experience to help other patients.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!fixedDoctorId && (
            <div className="space-y-1.5">
              <Label>Doctor *</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger><SelectValue placeholder="Choose a doctor" /></SelectTrigger>
                <SelectContent>
                  {(doctors.data ?? []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.fullName} — {d.specialty.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Patient *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Who is reviewing?" /></SelectTrigger>
              <SelectContent>
                {(patients.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Rating *</Label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rv-comment">Your Experience *</Label>
            <Textarea
              id="rv-comment"
              rows={4}
              placeholder="How was the consultation, treatment and care…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={mutation.isPending || !patientId || !(fixedDoctorId || doctorId) || !comment.trim()}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 size={15} className="mr-1 animate-spin" aria-hidden />}
            Publish Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { WriteReviewDialog };

// --------------------------------------------------------- Doctor profile view

function DoctorProfileDialog({ doctor, onClose, onWriteReview }: { doctor: Doctor | null; onClose: () => void; onWriteReview: (doctorId: number) => void }) {
  const reviews = useQuery({
    queryKey: ["reviews", "doctor", doctor?.id],
    queryFn: () => fetchReviews({ doctorId: doctor!.id }),
    enabled: !!doctor,
  });
  if (!doctor) return null;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: (reviews.data ?? []).filter((r) => r.rating === star).length,
  }));
  const total = reviews.data?.length ?? 0;

  return (
    <Dialog open={!!doctor} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Doctor Profile</DialogTitle>
          <DialogDescription>Complete profile and verified patient reviews</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="relative mx-auto h-52 w-40 shrink-0 overflow-hidden rounded-xl border border-border/60 sm:mx-0">
            <Image src={doctor.photo} alt={`Portrait of ${doctor.fullName}`} fill sizes="160px" className="object-cover" />
            {!doctor.isAvailable && (
              <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 py-1 text-center text-[11px] font-semibold text-white">
                On Leave
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold">{doctor.fullName}</h3>
              <BadgeCheck size={18} className="text-emerald-600" aria-label="Verified doctor" />
              <StatusBadge status={doctor.isAvailable ? "AVAILABLE" : "CLEANING"} className={doctor.isAvailable ? "" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"} />
            </div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{doctor.designation} • {doctor.specialty.name}</p>
            <div className="flex items-center gap-2">
              <Stars rating={doctor.rating} size={16} />
              <span className="text-sm font-semibold">{doctor.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({doctor.reviewCount} reviews)</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                <p className="font-bold">৳{doctor.consultationFee}</p>
                <p className="text-[11px] text-muted-foreground">Consultation</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                <p className="font-bold">{doctor.experienceYears} yrs</p>
                <p className="text-[11px] text-muted-foreground">Experience</p>
              </div>
              <div className="min-w-0 rounded-lg bg-muted/60 p-2.5 text-center">
                <p className="truncate font-bold">{doctor._count?.appointments ?? doctor.reviewCount}</p>
                <p className="text-[11px] text-muted-foreground">Appointments</p>
              </div>
              <div className="min-w-0 rounded-lg bg-muted/60 p-2.5 text-center">
                <p className="truncate font-bold">{doctor._count?.reviews ?? doctor.reviewCount}</p>
                <p className="text-[11px] text-muted-foreground">Reviews</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail size={14} aria-hidden />{doctor.email}</span>
              <span className="flex items-center gap-1.5"><Phone size={14} aria-hidden />{doctor.phone}</span>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onWriteReview(doctor.id)}>
              <Star size={15} className="mr-1.5" aria-hidden /> Write a Review
            </Button>
          </div>
        </div>

        {/* Reviews section */}
        <div className="space-y-3 border-t border-border/60 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold">Patient Reviews ({total})</h4>
            <div className="flex gap-1.5">
              {distribution.map(({ star, count }) => (
                <span key={star} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium" title={`${star} star: ${count}`}>
                  {star}★ {count}
                </span>
              ))}
            </div>
          </div>
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {(reviews.data ?? []).map((r) => (
              <ReviewRow key={r.id} review={r} />
            ))}
            {reviews.data?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No reviews yet — be the first to review!</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <div className="rounded-lg border border-border/50 p-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{review.patient.fullName}</span>
        <Stars rating={review.rating} size={13} />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
      <p className="mt-1.5 text-[11px] text-muted-foreground/70">{timeAgo(review.createdAt)}</p>
    </div>
  );
}

export { ReviewRow };

// ----------------------------------------------------------------- Main module

export function DoctorsModule() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState<Doctor | null>(null);
  const [reviewFor, setReviewFor] = useState<number | null>(null);

  const doctors = useQuery({
    queryKey: ["doctors", search],
    queryFn: () => fetchDoctors({ search }),
  });
  const specialties = useQuery({ queryKey: ["specialties"], queryFn: fetchSpecialties });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDoctor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["specialties"] });
      toast.success("Doctor removed from the directory");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(
    () =>
      (doctors.data ?? []).filter(
        (d) => specialtyFilter === "all" || String(d.specialtyId) === specialtyFilter
      ),
    [doctors.data, specialtyFilter]
  );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Search doctors by name, designation or bio…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search doctors"
          />
        </div>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All Specialties" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {(specialties.data ?? []).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.doctorCount})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <UserPlus size={16} className="mr-1.5" aria-hidden /> Add Doctor
        </Button>
      </div>

      {/* Grid */}
      {doctors.isLoading ? (
        <CardSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors found" description="Try a different search term or specialty filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d) => (
            <Card key={d.id} className="group overflow-hidden border-border/60 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-[4/3.4] w-full overflow-hidden bg-muted">
                <Image
                  src={d.photo}
                  alt={`Portrait of ${d.fullName}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute left-3 top-3">
                  <StatusBadge status={d.isAvailable ? "AVAILABLE" : "CLEANING"} className={d.isAvailable ? "" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"} />
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-sm">
                  ★ {d.rating.toFixed(1)}
                </span>
              </div>
              <CardContent className="space-y-2.5 p-4">
                <div>
                  <h3 className="truncate font-semibold">{d.fullName}</h3>
                  <p className="truncate text-sm text-emerald-700 dark:text-emerald-400">{d.designation}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="secondary" className="border-0 font-medium">{d.specialty.name}</Badge>
                  <span>{d.experienceYears}+ yrs • ৳{d.consultationFee}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Stars rating={d.rating} size={13} />
                  <span className="text-xs text-muted-foreground">({d.reviewCount})</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => setProfile(d)}>
                    <Eye size={14} className="mr-1" aria-hidden /> Profile
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Edit ${d.fullName}`} onClick={() => { setEditing(d); setFormOpen(true); }}>
                    <Pencil size={14} aria-hidden />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950" aria-label={`Delete ${d.fullName}`} onClick={() => setDeleting(d)}>
                    <Trash2 size={14} aria-hidden />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <DoctorFormDialog open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <DoctorProfileDialog doctor={profile} onClose={() => setProfile(null)} onWriteReview={(id) => { setProfile(null); setReviewFor(id); }} />
      <WriteReviewDialog open={reviewFor !== null} onClose={() => setReviewFor(null)} fixedDoctorId={reviewFor ?? undefined} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the doctor profile along with their appointments, reviews and
              blog articles. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              {deleteMutation.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Trash2 size={15} className="mr-1" aria-hidden />}
              Delete Doctor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
