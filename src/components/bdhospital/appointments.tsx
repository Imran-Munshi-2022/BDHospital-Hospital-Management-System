"use client";

// BDHospital — appointments: booking, filters, status workflow, queue hand-off
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CalendarPlus, CalendarDays, CheckCircle2, XCircle, Trash2, Radio, Loader2,
  ArrowRight, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  fetchAppointments, fetchDoctors, fetchPatients, fetchTracking, createAppointment, updateAppointment,
  deleteAppointment, checkInPatient, TIME_SLOTS, type Appointment, type AppointmentStatus,
} from "@/lib/api";
import { EmptyState, TableSkeleton, StatusBadge, formatDate } from "./shared";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "TODAY", label: "Today" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// --------------------------------------------------------------- Booking dialog

function BookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const doctors = useQuery({ queryKey: ["doctors", ""], queryFn: () => fetchDoctors() });
  const patients = useQuery({ queryKey: ["patients", ""], queryFn: () => fetchPatients() });
  const appointments = useQuery({ queryKey: ["appointments", "all"], queryFn: () => fetchAppointments() });

  const [doctorId, setDoctorId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [init, setInit] = useState(false);

  if (open && !init) { setInit(true); setDoctorId(""); setPatientId(""); setDate(todayStr()); setTimeSlot(""); setReason(""); }
  if (!open && init) setInit(false);

  const takenSlots = useMemo(
    () =>
      new Set(
        (appointments.data ?? [])
          .filter((a) => String(a.doctorId) === doctorId && a.date === date && a.status !== "CANCELLED")
          .map((a) => a.timeSlot)
      ),
    [appointments.data, doctorId, date]
  );

  const mutation = useMutation({
    mutationFn: () => createAppointment({ doctorId: Number(doctorId), patientId: Number(patientId), date, timeSlot, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Appointment booked — the doctor will confirm shortly");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarPlus size={17} className="text-emerald-600" aria-hidden /> Book an Appointment</DialogTitle>
          <DialogDescription>Choose a doctor, patient, date and time slot.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Doctor *</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {(doctors.data ?? []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.fullName} — {d.specialty.name}{!d.isAvailable ? " (on leave)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {(patients.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-date">Date *</Label>
              <Input id="appt-date" type="date" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Time Slot *</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot} disabled={takenSlots.has(slot)}>
                      {slot}{takenSlots.has(slot) ? " — booked" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appt-reason">Reason for Visit *</Label>
            <Textarea id="appt-reason" rows={3} placeholder="Describe symptoms or the purpose of the visit…" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={mutation.isPending || !doctorId || !patientId || !date || !timeSlot || !reason.trim()}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 size={15} className="mr-1 animate-spin" aria-hidden />}
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ Main module

export function AppointmentsModule() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [bookOpen, setBookOpen] = useState(false);

  const today = todayStr();
  const appointments = useQuery({
    queryKey: ["appointments", filter],
    queryFn: () => {
      if (filter === "all") return fetchAppointments();
      if (filter === "TODAY") return fetchAppointments({ date: today });
      return fetchAppointments({ status: filter });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) => updateAppointment(id, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`Appointment marked as ${vars.status.toLowerCase()}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Appointment deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const queueMutation = useMutation({
    mutationFn: (a: Appointment) => checkInPatient({ patientId: a.patientId, appointmentId: a.id, priority: "NORMAL" }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tracking"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`${data.record.patient.fullName} checked in — Token ${data.record.tokenNumber}. Follow the journey in Live Tracking!`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const list = appointments.data ?? [];
    return {
      total: list.length,
      scheduled: list.filter((a) => a.status === "SCHEDULED").length,
      confirmed: list.filter((a) => a.status === "CONFIRMED").length,
    };
  }, [appointments.data]);

  const queuedPatientIds = useQuery({
    queryKey: ["tracking"],
    queryFn: fetchTracking,
    select: (d) => new Set(d.records.filter((r) => r.status === "ACTIVE").map((r) => r.patientId)),
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Appointment filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key ? "bg-emerald-600 text-white shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setBookOpen(true)}>
          <CalendarPlus size={16} className="mr-1.5" aria-hidden /> Book Appointment
        </Button>
      </div>

      {appointments.isLoading ? (
        <TableSkeleton rows={6} />
      ) : (appointments.data ?? []).length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointments here" description="Book a new appointment or pick a different filter." />
      ) : (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient → Doctor</TableHead>
                <TableHead className="hidden md:table-cell">Date &amp; Time</TableHead>
                <TableHead className="hidden lg:table-cell min-w-48">Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(appointments.data ?? []).map((a) => {
                const alreadyQueued = queuedPatientIds.data?.has(a.patientId) ?? false;
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/60">
                          <Image src={a.doctor.photo} alt="" fill sizes="36px" className="object-cover object-top" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {a.patient.fullName} <ArrowRight size={11} className="inline text-muted-foreground" aria-hidden /> {a.doctor.fullName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {a.doctor.specialty.name} • {a.patient.age}y {a.patient.bloodGroup}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm">{formatDate(a.date)}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock size={11} aria-hidden />{a.timeSlot}</p>
                    </TableCell>
                    <TableCell className="hidden max-w-64 truncate text-sm text-muted-foreground lg:table-cell">{a.reason}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {a.status === "SCHEDULED" && (
                          <Button variant="outline" size="sm" className="h-8 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950" onClick={() => statusMutation.mutate({ id: a.id, status: "CONFIRMED" })}>
                            <CheckCircle2 size={13} className="mr-1" aria-hidden /> Confirm
                          </Button>
                        )}
                        {a.status === "CONFIRMED" && (
                          <>
                            <Button variant="outline" size="sm" className="h-8 border-teal-600/40 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950" onClick={() => statusMutation.mutate({ id: a.id, status: "COMPLETED" })}>
                              <CheckCircle2 size={13} className="mr-1" aria-hidden /> Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-emerald-600/50 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                              disabled={queueMutation.isPending || alreadyQueued}
                              onClick={() => queueMutation.mutate(a)}
                              title="Send patient into the live hospital flow"
                            >
                              <Radio size={13} className="mr-1" aria-hidden /> {alreadyQueued ? "In Queue" : "Send to Queue"}
                            </Button>
                          </>
                        )}
                        {a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                          <Button variant="ghost" size="sm" className="h-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950" onClick={() => statusMutation.mutate({ id: a.id, status: "CANCELLED" })}>
                            <XCircle size={13} className="mr-1" aria-hidden /> Cancel
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950" aria-label="Delete appointment" onClick={() => deleteMutation.mutate(a.id)}>
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

      <p className="text-xs text-muted-foreground">
        Showing {counts.total} appointments • {counts.scheduled} scheduled • {counts.confirmed} confirmed.
        Confirmed patients can be sent to the live queue and tracked in real time.
      </p>

      <BookingDialog open={bookOpen} onClose={() => setBookOpen(false)} />
    </div>
  );
}
