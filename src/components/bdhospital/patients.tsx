"use client";

// BDHospital — patient registry: search, CRUD, profile, live check-in
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search, UserPlus, Users, Pencil, Trash2, Eye, Phone, Mail, MapPin, Droplets,
  ShieldCheck, CalendarDays, Radio, Loader2, ClipboardList, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  fetchPatients, createPatient, updatePatient, deletePatient,
  fetchAppointments, fetchReviews, fetchTracking, checkInPatient,
  type Patient, type AppointmentStatus,
} from "@/lib/api";
import { InitialsAvatar, EmptyState, TableSkeleton, timeAgo, formatDate, Stars, StatusBadge, PriorityBadge } from "./shared";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ---------------------------------------------------------------- Patient form

type PatientForm = {
  fullName: string; email: string; phone: string; gender: string; age: string;
  bloodGroup: string; address: string; insuranceId: string;
};

const emptyForm: PatientForm = {
  fullName: "", email: "", phone: "", gender: "Male", age: "30",
  bloodGroup: "O+", address: "", insuranceId: "",
};

function PatientFormDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Patient | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [init, setInit] = useState(false);

  if (open && !init) {
    setInit(true);
    setForm(
      editing
        ? {
            fullName: editing.fullName, email: editing.email, phone: editing.phone, gender: editing.gender,
            age: String(editing.age), bloodGroup: editing.bloodGroup, address: editing.address,
            insuranceId: editing.insuranceId ?? "",
          }
        : emptyForm
    );
  }
  if (!open && init) setInit(false);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        fullName: form.fullName, email: form.email, phone: form.phone, gender: form.gender,
        age: Number(form.age) || 0, bloodGroup: form.bloodGroup, address: form.address,
        insuranceId: form.insuranceId || null,
      };
      return editing ? updatePatient(editing.id, payload) : createPatient(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(editing ? "Patient record updated" : `${form.fullName} registered successfully`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof PatientForm>(k: K, v: PatientForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Patient Record" : "Register New Patient"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the patient's personal and medical details." : "Add a new patient to the BDHospital registry."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-name">Full Name *</Label>
            <Input id="p-name" placeholder="Patient's full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-email">Email *</Label>
            <Input id="p-email" type="email" placeholder="patient@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-phone">Phone *</Label>
            <Input id="p-phone" placeholder="+8801XXXXXXXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
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
            <Label htmlFor="p-age">Age</Label>
            <Input id="p-age" type="number" min={0} max={120} value={form.age} onChange={(e) => set("age", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Blood Group</Label>
            <Select value={form.bloodGroup} onValueChange={(v) => set("bloodGroup", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-ins">Insurance ID</Label>
            <Input id="p-ins" placeholder="Optional" value={form.insuranceId} onChange={(e) => set("insuranceId", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-addr">Address</Label>
            <Input id="p-addr" placeholder="House, Road, Area, City" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={mutation.isPending || !form.fullName || !form.email || !form.phone}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 size={15} className="mr-1 animate-spin" aria-hidden />}
            {editing ? "Save Changes" : "Register Patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------- Check-in (queue) dialog

function CheckInDialog({ patient, onClose }: { patient: Patient | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [priority, setPriority] = useState("NORMAL");
  const [init, setInit] = useState(false);
  if (!!patient && !init) { setInit(true); setPriority("NORMAL"); }
  if (!patient && init) setInit(false);

  const mutation = useMutation({
    mutationFn: () => checkInPatient({ patientId: patient!.id, priority }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tracking"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`${patient!.fullName} checked in — Token ${data.record.tokenNumber}`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!patient} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Radio size={17} className="text-emerald-600" aria-hidden /> Check In Patient</DialogTitle>
          <DialogDescription>
            Send {patient?.fullName} into the live hospital flow. A queue token will be issued.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NORMAL">Normal — regular visit</SelectItem>
              <SelectItem value="URGENT">Urgent — needs prompt attention</SelectItem>
              <SelectItem value="EMERGENCY">Emergency — immediate care</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 size={15} className="mr-1 animate-spin" aria-hidden />}
            Issue Token &amp; Check In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------- Patient profile

function PatientProfileDialog({
  patient, onClose, onEdit, onCheckIn,
}: {
  patient: Patient | null;
  onClose: () => void;
  onEdit: (p: Patient) => void;
  onCheckIn: (p: Patient) => void;
}) {
  const appointments = useQuery({
    queryKey: ["appointments", "patient", patient?.id],
    queryFn: () => fetchAppointments({ patientId: patient!.id }),
    enabled: !!patient,
  });
  const reviews = useQuery({
    queryKey: ["reviews", "patient", patient?.id],
    queryFn: () => fetchReviews({ patientId: patient!.id }),
    enabled: !!patient,
  });
  const tracking = useQuery({ queryKey: ["tracking"], queryFn: fetchTracking, refetchInterval: 4000 });

  if (!patient) return null;
  const activeRecord = (tracking.data?.records ?? []).find(
    (r) => r.patientId === patient.id && r.status === "ACTIVE"
  );

  return (
    <Dialog open={!!patient} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Patient Profile</DialogTitle>
          <DialogDescription>Complete medical journey at BDHospital</DialogDescription>
        </DialogHeader>

        {/* Identity card */}
        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center">
          <InitialsAvatar name={patient.fullName} size={64} />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold">{patient.fullName}</h3>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Droplets size={14} className="text-rose-500" aria-hidden />{patient.bloodGroup}</span>
              <span>{patient.gender} • {patient.age} yrs</span>
              <span className="flex items-center gap-1.5"><Phone size={13} aria-hidden />{patient.phone}</span>
              <span className="flex items-center gap-1.5"><Mail size={13} aria-hidden />{patient.email}</span>
              {patient.address && <span className="flex items-center gap-1.5"><MapPin size={13} aria-hidden />{patient.address}</span>}
              {patient.insuranceId && <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" aria-hidden />{patient.insuranceId}</span>}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(patient)}><Pencil size={14} className="mr-1" aria-hidden /> Edit</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onCheckIn(patient)} disabled={!!activeRecord}>
              <Radio size={14} className="mr-1" aria-hidden /> {activeRecord ? "In Queue" : "Check In"}
            </Button>
          </div>
        </div>

        {activeRecord && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-600/30 bg-emerald-50 p-3.5 dark:bg-emerald-950/40">
            <span className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white">{activeRecord.tokenNumber}</span>
            <span className="text-sm font-medium">{activeRecord.patient.fullName} is currently at</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{activeRecord.room}</span>
            <span className="text-xs text-muted-foreground">({activeRecord.stages.find((s) => s.status === "current")?.label ?? "In progress"}) • waiting {activeRecord.waitMinutes} min</span>
            <PriorityBadge priority={activeRecord.priority} />
          </div>
        )}

        <Tabs defaultValue="appointments">
          <TabsList className="w-full">
            <TabsTrigger value="appointments" className="flex-1"><CalendarDays size={14} className="mr-1.5" aria-hidden /> Appointments ({appointments.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1">Reviews Given ({reviews.data?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="appointments" className="mt-3 max-h-64 overflow-y-auto">
            {(appointments.data ?? []).length === 0 ? (
              <EmptyState icon={CalendarDays} title="No appointments yet" />
            ) : (
              <ul className="space-y-2">
                {(appointments.data ?? []).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border/50 px-3 py-2.5 text-sm">
                    <span className="font-medium">{formatDate(a.date)}</span>
                    <span className="text-muted-foreground">{a.timeSlot}</span>
                    <span className="min-w-0 flex-1 truncate">Dr. {a.doctor.fullName.replace("Dr. ", "")} — {a.reason}</span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="reviews" className="mt-3 max-h-64 overflow-y-auto">
            {(reviews.data ?? []).length === 0 ? (
              <EmptyState icon={ClipboardList} title="No reviews written yet" />
            ) : (
              <ul className="space-y-2">
                {(reviews.data ?? []).map((r) => (
                  <li key={r.id} className="rounded-lg border border-border/50 px-3 py-2.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{r.doctor.fullName}</span>
                      <Stars rating={r.rating} size={12} />
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{r.comment}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------- Main module

export function PatientsModule() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [profile, setProfile] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const [checkingIn, setCheckingIn] = useState<Patient | null>(null);

  const patients = useQuery({ queryKey: ["patients", search], queryFn: () => fetchPatients(search) });
  const tracking = useQuery({ queryKey: ["tracking"], queryFn: fetchTracking, refetchInterval: 4000 });

  const activeByPatient = new Map(
    (tracking.data?.records ?? []).filter((r) => r.status === "ACTIVE").map((r) => [r.patientId, r])
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePatient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["tracking"] });
      toast.success("Patient record deleted");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openProfile = (p: Patient) => setProfile(p);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Search patients by name, email, phone or blood group…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search patients"
          />
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <UserPlus size={16} className="mr-1.5" aria-hidden /> Register Patient
        </Button>
      </div>

      {patients.isLoading ? (
        <TableSkeleton rows={6} />
      ) : (patients.data ?? []).length === 0 ? (
        <EmptyState icon={Users} title="No patients found" description="Try a different search, or register a new patient." />
      ) : (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Age / Gender</TableHead>
                <TableHead>Blood</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden xl:table-cell">Insurance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(patients.data ?? []).map((p) => {
                const active = activeByPatient.get(p.id);
                return (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => openProfile(p)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={p.fullName} size={36} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{p.age} • {p.gender}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-rose-200 bg-rose-50 font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
                        {p.bloodGroup}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{p.phone}</TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{p.insuranceId ?? "—"}</TableCell>
                    <TableCell>
                      {active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                            <span className="relative h-2 w-2 rounded-full bg-emerald-600" />
                          </span>
                          {active.tokenNumber} • {active.currentStage.charAt(0) + active.currentStage.slice(1).toLowerCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Idle</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`View ${p.fullName}`} onClick={() => openProfile(p)}>
                          <Eye size={14} aria-hidden />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Edit ${p.fullName}`} onClick={() => { setEditing(p); setFormOpen(true); }}>
                          <Pencil size={14} aria-hidden />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950" aria-label={`Delete ${p.fullName}`} onClick={() => setDeleting(p)}>
                          <Trash2 size={14} aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <PatientFormDialog open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <PatientProfileDialog
        patient={profile}
        onClose={() => setProfile(null)}
        onEdit={(p) => { setProfile(null); setEditing(p); setFormOpen(true); }}
        onCheckIn={(p) => { setProfile(null); setCheckingIn(p); }}
      />
      <CheckInDialog patient={checkingIn} onClose={() => setCheckingIn(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.fullName}&apos;s record?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the patient along with their appointments, reviews and
              tracking history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => deleting && deleteMutation.mutate(deleting.id)}>
              {deleteMutation.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Trash2 size={15} className="mr-1" aria-hidden />}
              Delete Patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
