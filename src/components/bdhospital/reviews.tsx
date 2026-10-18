"use client";

// BDHospital — doctor reviews: summary, distribution, wall, write & moderate
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Star, Trash2, MessageSquareQuote, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fetchReviews, fetchDoctors, deleteReview, type Review } from "@/lib/api";
import { Stars, InitialsAvatar, EmptyState, CardSkeleton, timeAgo } from "./shared";
import { WriteReviewDialog } from "./doctors";

export function ReviewsModule() {
  const qc = useQueryClient();
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [writeOpen, setWriteOpen] = useState(false);

  const reviews = useQuery({ queryKey: ["reviews"], queryFn: () => fetchReviews() });
  const doctors = useQuery({ queryKey: ["doctors", ""], queryFn: () => fetchDoctors() });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Review removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const all = reviews.data ?? [];
  const filtered = useMemo(
    () => (doctorFilter === "all" ? all : all.filter((r) => String(r.doctorId) === doctorFilter)),
    [all, doctorFilter]
  );

  const total = all.length;
  const avg = total ? all.reduce((s, r) => s + r.rating, 0) / total : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: all.filter((r) => r.rating === star).length,
    pct: total ? Math.round((all.filter((r) => r.rating === star).length / total) * 100) : 0,
  }));

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-5 p-6">
            <div className="text-center">
              <p className="text-5xl font-extrabold tracking-tight">{avg.toFixed(1)}</p>
              <Stars rating={avg} size={16} className="mt-1 justify-center" />
              <p className="mt-1 text-xs text-muted-foreground">{total} verified reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {distribution.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 font-semibold">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">What Patients Say</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {(() => {
              const p5 = distribution[0].count, p4 = distribution[1].count;
              const positive = total ? Math.round(((p5 + p4) / total) * 100) : 0;
              return (
                <>
                  <p><span className="text-2xl font-bold text-emerald-600">{positive}%</span> of reviews are 4★ or 5★</p>
                  <p className="text-muted-foreground">
                    Reviews come from patients with completed visits at BDHospital. Doctors never see
                    reviews before publication — ratings update instantly in the directory.
                  </p>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center gap-3 border-emerald-600/25 bg-emerald-50/50 shadow-sm dark:bg-emerald-950/20">
          <CardContent className="p-6">
            <p className="font-semibold">Received great care?</p>
            <p className="mb-3 text-sm text-muted-foreground">Your feedback helps thousands of patients choose the right doctor.</p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setWriteOpen(true)}>
              <Star size={15} className="mr-1.5" aria-hidden /> Write a Review
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold tracking-tight">
          Patient Reviews <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
        </h3>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="All doctors" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All doctors</SelectItem>
            {(doctors.data ?? []).map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.fullName} • {d.rating.toFixed(1)}★ ({d.reviewCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Wall */}
      {reviews.isLoading ? (
        <CardSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="No reviews yet" description="Be the first to share your experience with BDHospital doctors." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <ReviewCard key={r.id} review={r} onDelete={() => deleteMutation.mutate(r.id)} deleting={deleteMutation.isPending} />
          ))}
        </div>
      )}

      <WriteReviewDialog open={writeOpen} onClose={() => setWriteOpen(false)} />
    </div>
  );
}

function ReviewCard({ review, onDelete, deleting }: { review: Review; onDelete: () => void; deleting: boolean }) {
  return (
    <Card className="flex flex-col border-border/60 py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <InitialsAvatar name={review.patient.fullName} size={38} />
            <div>
              <p className="text-sm font-semibold">{review.patient.fullName}</p>
              <p className="text-[11px] text-muted-foreground">{timeAgo(review.createdAt)}</p>
            </div>
          </div>
          <Stars rating={review.rating} size={14} />
        </div>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Reviewed: {review.doctor.fullName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            aria-label="Delete review"
            disabled={deleting}
            onClick={onDelete}
          >
            {deleting ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Trash2 size={13} aria-hidden />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
