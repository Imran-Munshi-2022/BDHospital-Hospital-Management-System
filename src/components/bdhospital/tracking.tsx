"use client";

// BDHospital — LIVE patient tracking: real-time department flow + ward & bed management
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList, HeartPulse, Stethoscope, Microscope, Pill, BadgeCheck, UserPlus,
  Loader2, ArrowRight, CheckCircle2, BedDouble, Radio, Activity, Thermometer, Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  fetchTracking, fetchBeds, fetchPatients, trackingAction, updateBed, checkInPatient,
  STAGE_ORDER, STAGE_META, type TrackingRecord, type Bed,
} from "@/lib/api";
import { PriorityBadge, InitialsAvatar, formatDateTime } from "./shared";

const STAGE_ICONS: Record<string, typeof ClipboardList> = {
  REGISTRATION: ClipboardList,
  TRIAGE: HeartPulse,
  CONSULTATION: Stethoscope,
  DIAGNOSTICS: Microscope,
  PHARMACY: Pill,
  CHECKOUT: BadgeCheck,
};

// ------------------------------------------------------------- Patient card in the flow board

function PatientFlowCard({ record, onOpen }: { record: TrackingRecord; onOpen: () => void }) {
  return (
    <motion.button
      layout
      layoutId={`tracking-${record.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      onClick={onOpen}
      className="w-full rounded-xl border border-border/60 bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label={`View ${record.patient.fullName} (${record.tokenNumber})`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {record.tokenNumber}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{record.patient.fullName}</span>
        {record.priority !== "NORMAL" && <PriorityBadge priority={record.priority} />}
      </div>
      <p className="mb-2 truncate text-[11px] text-muted-foreground">
        {record.room} • {record.patient.age}y {record.patient.gender} • {record.patient.bloodGroup}
      </p>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{record.stages.find((s) => s.status === "current")?.label ?? "In progress"}</span>
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">{record.waitMinutes} min in hospital</span>
      </div>
      <Progress value={record.stageProgress} className="h-1.5" />
      <p className="mt-1 text-right text-[10px] text-muted-foreground">{record.stageProgress}% through this stage</p>
    </motion.button>
  );
}

// ------------------------------------------------------------- Record detail dialog

function RecordDetailDialog({ record, onClose }: { record: TrackingRecord | null; onClose: () => void }) {
  const qc = useQueryClient();
  const advanceMutation = useMutation({
    mutationFn: (action: "advance" | "complete") => trackingAction(record!.id, action),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tracking"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      if (data.record.status === "COMPLETED") toast.success(`${record!.patient.fullName} has completed the hospital journey`);
      else toast.success(`${record!.patient.fullName} moved to ${data.record.room}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!record) return null;
  const active = record.status === "ACTIVE";

  return (
    <Dialog open={!!record} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {record.tokenNumber}
            </span>
            {record.patient.fullName}
            <PriorityBadge priority={record.priority} />
          </DialogTitle>
          <DialogDescription>
            {active ? `Currently at ${record.room} — ${record.stages.find((s) => s.status === "current")?.label}` : "Journey completed"}
          </DialogDescription>
        </DialogHeader>

        {/* Vitals */}
        {record.vitals && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Activity, label: "BP", value: record.vitals.bp },
              { icon: HeartPulse, label: "Pulse", value: `${record.vitals.pulse} bpm` },
              { icon: Thermometer, label: "Temp", value: `${record.vitals.temp}°F` },
              { icon: Wind, label: "SpO₂", value: `${record.vitals.spo2}%` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg border border-border/60 bg-muted/40 p-2.5 text-center">
                <Icon size={15} className="mx-auto mb-1 text-emerald-600" aria-hidden />
                <p className="text-sm font-bold">{value}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Stage timeline */}
        <div>
          <p className="mb-3 text-sm font-semibold">Journey Timeline</p>
          <ol className="relative ml-3 space-y-0 border-l-2 border-border">
            {record.stages.map((stage) => {
              const historyEntry = record.history.find((h) => h.stage === stage.key);
              return (
                <li key={stage.key} className="relative ml-5 pb-4 last:pb-0">
                  <span
                    className={`absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-card ${
                      stage.status === "done"
                        ? "bg-emerald-600"
                        : stage.status === "current"
                          ? "bg-amber-500 animate-pulse"
                          : "bg-muted-foreground/25"
                    }`}
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className={`text-sm font-medium ${stage.status === "pending" ? "text-muted-foreground/60" : ""}`}>
                      {stage.label}
                    </span>
                    {stage.status === "done" && historyEntry && (
                      <span className="text-[11px] text-muted-foreground">{historyEntry.durationMin} min</span>
                    )}
                    {stage.status === "current" && (
                      <span className="text-[11px] font-semibold text-amber-600">in progress…</span>
                    )}
                  </div>
                  {stage.enteredAt && stage.status !== "pending" && (
                    <p className="text-[11px] text-muted-foreground">{formatDateTime(stage.enteredAt)}</p>
                  )}
                </li>
              );
            })}
            {record.status === "COMPLETED" && (
              <li className="relative ml-5">
                <span className="absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 ring-4 ring-card" aria-hidden>
                  <CheckCircle2 size={10} className="text-white" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Journey completed</span>
              </li>
            )}
          </ol>
        </div>

        {/* Doctor info */}
        {record.appointment && (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
            <p className="font-medium">{record.appointment.doctor.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {record.appointment.doctor.specialty.name} • Appointment on {record.appointment.date} at {record.appointment.timeSlot}
            </p>
          </div>
        )}

        {active && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
              disabled={advanceMutation.isPending}
              onClick={() => advanceMutation.mutate("advance")}
            >
              {advanceMutation.isPending ? <Loader2 size={14} className="mr-1 animate-spin" aria-hidden /> : <ArrowRight size={14} className="mr-1" aria-hidden />}
              Advance Stage
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={advanceMutation.isPending} onClick={() => advanceMutation.mutate("complete")}>
              <CheckCircle2 size={14} className="mr-1" aria-hidden />
              Complete Journey
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------- New arrival dialog

function NewArrivalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const patients = useQuery({ queryKey: ["patients", ""], queryFn: () => fetchPatients(), enabled: open });
  const [patientId, setPatientId] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [init, setInit] = useState(false);
  if (open && !init) { setInit(true); setPatientId(""); setPriority("NORMAL"); }
  if (!open && init) setInit(false);

  const mutation = useMutation({
    mutationFn: () => checkInPatient({ patientId: Number(patientId), priority }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tracking"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`Token ${data.record.tokenNumber} issued for ${data.record.patient.fullName}`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus size={17} className="text-emerald-600" aria-hidden /> New Patient Arrival</DialogTitle>
          <DialogDescription>Register a walk-in patient into the live hospital flow.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Patient *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
              <SelectContent>
                {(patients.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.fullName} • {p.age}y {p.bloodGroup}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={mutation.isPending || !patientId} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 size={15} className="mr-1 animate-spin" aria-hidden />}
            Check In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------- Bed management

const WARD_DISPLAY: Record<string, { title: string; image?: string }> = {
  GENERAL: { title: "General Ward", image: "/images/wards/general.png" },
  ICU: { title: "Intensive Care Unit (ICU)", image: "/images/wards/icu.png" },
  EMERGENCY: { title: "Emergency Ward" },
  MATERNITY: { title: "Maternity Ward" },
  PEDIATRIC: { title: "Pediatric Ward" },
};

function BedSquare({ bed, onClick }: { bed: Bed; onClick: () => void }) {
  const styles: Record<string, string> = {
    AVAILABLE: "bg-emerald-500/90 hover:bg-emerald-600 text-white",
    OCCUPIED: "bg-rose-500/90 hover:bg-rose-600 text-white",
    CLEANING: "bg-amber-500/90 hover:bg-amber-600 text-white",
  };
  return (
    <button
      onClick={onClick}
      title={`${bed.bedNumber} — ${bed.status}${bed.patient ? ` — ${bed.patient.fullName}` : ""}`}
      aria-label={`Bed ${bed.bedNumber}, ${bed.status}${bed.patient ? `, ${bed.patient.fullName}` : ""}`}
      className={`flex h-11 w-11 flex-col items-center justify-center rounded-lg text-[9px] font-bold leading-tight shadow-sm transition-colors ${styles[bed.status]}`}
    >
      {bed.bedNumber.split("-")[1]}
      <span className="text-[7px] font-medium opacity-80">
        {bed.status === "OCCUPIED" ? bed.patient?.fullName.split(" ")[0].slice(0, 5) : bed.status.slice(0, 3)}
      </span>
    </button>
  );
}

function BedDialog({ bed, onClose }: { bed: Bed | null; onClose: () => void }) {
  const qc = useQueryClient();
  const patients = useQuery({ queryKey: ["patients", ""], queryFn: () => fetchPatients(), enabled: !!bed });
  const [assignId, setAssignId] = useState("");
  const [init, setInit] = useState(false);
  if (!!bed && !init) { setInit(true); setAssignId(""); }
  if (!bed && init) setInit(false);

  const update = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateBed(bed!.id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`${data.bed.bedNumber} updated`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!bed) return null;

  return (
    <Dialog open={!!bed} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BedDouble size={17} className="text-emerald-600" aria-hidden /> Bed {bed.bedNumber}</DialogTitle>
          <DialogDescription>
            {bed.ward} ward • currently <span className="font-semibold">{bed.status.toLowerCase()}</span>
            {bed.patient ? ` — ${bed.patient.fullName} (${bed.patient.bloodGroup})` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {bed.status !== "OCCUPIED" && (
            <div className="space-y-1.5">
              <Label>Assign a patient</Label>
              <Select value={assignId} onValueChange={setAssignId}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {(patients.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.fullName} • {p.bloodGroup}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!assignId || update.isPending}
                onClick={() => update.mutate({ status: "OCCUPIED", patientId: Number(assignId) })}
              >
                {update.isPending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <BedDouble size={14} className="mr-1" aria-hidden />}
                Admit to Bed
              </Button>
            </div>
          )}
          {bed.status === "OCCUPIED" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-amber-500/50 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
              disabled={update.isPending}
              onClick={() => update.mutate({ status: "CLEANING" })}
            >
              Discharge &amp; Send to Cleaning
            </Button>
          )}
          {bed.status === "CLEANING" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
              disabled={update.isPending}
              onClick={() => update.mutate({ status: "AVAILABLE" })}
            >
              Mark as Cleaned &amp; Available
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ Main module

export function TrackingModule() {
  const [selected, setSelected] = useState<TrackingRecord | null>(null);
  const [arrivalOpen, setArrivalOpen] = useState(false);
  const [bedSelected, setBedSelected] = useState<Bed | null>(null);

  const tracking = useQuery({ queryKey: ["tracking"], queryFn: fetchTracking, refetchInterval: 3000 });
  const beds = useQuery({ queryKey: ["beds"], queryFn: fetchBeds, refetchInterval: 8000 });

  const records = tracking.data?.records ?? [];
  const active = records.filter((r) => r.status === "ACTIVE");
  const completedToday = records.filter((r) => r.status === "COMPLETED");
  const q = tracking.data?.queue;

  // Keep the open dialog fresh as data refetches
  const selectedFresh = selected ? records.find((r) => r.id === selected.id) ?? selected : null;

  return (
    <div className="space-y-6">
      {/* Live header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-600/25 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-emerald-950/40 dark:to-teal-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-600" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Live Patient Flow</h2>
            <p className="text-xs text-muted-foreground">
              Real-time board — auto-refreshes every 3 seconds from the hospital floor
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">{q?.active ?? 0} in queue</span>
          <span className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-sm">Avg wait {q?.avgWaitMinutes ?? 0} min</span>
          <span className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-sm">{q?.completedToday ?? 0} completed today</span>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setArrivalOpen(true)}>
            <UserPlus size={14} className="mr-1.5" aria-hidden /> New Arrival
          </Button>
        </div>
      </div>

      {/* Stage columns */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAGE_ORDER.map((stage) => {
          const Icon = STAGE_ICONS[stage];
          const stageRecords = active.filter((r) => r.currentStage === stage);
          const meta = STAGE_META[stage];
          return (
            <div key={stage} className="flex min-h-56 flex-col rounded-2xl border border-border/60 bg-muted/30 p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.color}`}>
                  <Icon size={16} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{meta.label}</p>
                  <p className="text-[11px] text-muted-foreground">{stageRecords.length} patient{stageRecords.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5">
                <AnimatePresence mode="popLayout">
                  {stageRecords.map((r) => (
                    <PatientFlowCard key={r.id} record={r} onOpen={() => setSelected(r)} />
                  ))}
                </AnimatePresence>
                {stageRecords.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-[11px] text-muted-foreground/70">
                    No patients
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed today */}
      {completedToday.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck size={17} className="text-teal-600" aria-hidden />
              Completed Journeys Today ({completedToday.length})
            </CardTitle>
            <CardDescription>Patients who finished their visit — total time in hospital shown per stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {completedToday.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="flex items-center gap-2 rounded-full border border-teal-600/30 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800 transition-colors hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-300"
                >
                  <BadgeCheck size={13} aria-hidden />
                  {r.tokenNumber} • {r.patient.fullName} • {r.waitMinutes || r.history.reduce((s, h) => s + h.durationMin, 0)} min total
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wards & beds */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BedDouble size={17} className="text-emerald-600" aria-hidden />
            Ward &amp; Bed Management
          </CardTitle>
          <CardDescription>
            Click any bed to assign a patient, discharge, or clean — {beds.data?.beds.filter((b) => b.status === "AVAILABLE").length ?? 0} beds available now
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {(beds.data?.wards ?? []).map((ward) => {
            const wardBeds = (beds.data?.beds ?? []).filter((b) => b.ward === ward.ward);
            const occupancy = ward.total ? Math.round((ward.occupied / ward.total) * 100) : 0;
            const display = WARD_DISPLAY[ward.ward] ?? { title: ward.ward };
            return (
              <div key={ward.ward} className="overflow-hidden rounded-xl border border-border/50">
                {display.image && (
                  <div className="relative h-24 w-full">
                    <Image
                      src={display.image}
                      alt={`${display.title} interior`}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-sm font-bold text-white drop-shadow">{display.title}</span>
                  </div>
                )}
              <div className="p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-semibold">{display.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {ward.occupied}/{ward.total} occupied
                      {ward.cleaning > 0 && ` • ${ward.cleaning} cleaning`}
                    </span>
                  </div>
                  <div className="flex w-40 items-center gap-2">
                    <Progress value={occupancy} className="h-2" />
                    <span className="text-xs font-semibold">{occupancy}%</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {wardBeds.map((bed) => (
                    <BedSquare key={bed.id} bed={bed} onClick={() => setBedSelected(bed)} />
                  ))}
                </div>
              </div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-500" /> Occupied</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500" /> Cleaning</span>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RecordDetailDialog record={selectedFresh} onClose={() => setSelected(null)} />
      <NewArrivalDialog open={arrivalOpen} onClose={() => setArrivalOpen(false)} />
      <BedDialog bed={bedSelected ? (beds.data?.beds.find((b) => b.id === bedSelected.id) ?? bedSelected) : null} onClose={() => setBedSelected(null)} />
    </div>
  );
}
