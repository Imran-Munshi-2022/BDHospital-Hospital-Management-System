"use client";

// BDHospital — health blogs: article cards, reader, author publishing
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import {
  Newspaper, Eye, PenLine, Trash2, X, Loader2, CalendarDays, UserRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchBlogs, createBlog, deleteBlog, fetchDoctors, BLOG_COVERS, type Blog,
} from "@/lib/api";
import { EmptyState, CardSkeleton, formatDate } from "./shared";

// ------------------------------------------------------------------ Blog reader

function BlogReaderDialog({ blog, onClose }: { blog: Blog | null; onClose: () => void }) {
  if (!blog) return null;
  return (
    <Dialog open={!!blog} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl leading-snug">{blog.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5"><UserRound size={13} aria-hidden />{blog.author.fullName}</span>
            <span className="flex items-center gap-1.5"><CalendarDays size={13} aria-hidden />{formatDate(blog.publishedAt.slice(0, 10))}</span>
            <span className="flex items-center gap-1.5"><Eye size={13} aria-hidden />{blog.views + 1} views</span>
            <Badge variant="secondary" className="border-0">{blog.category}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl">
          <Image src={blog.coverImage} alt={`Cover image for ${blog.title}`} fill sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
        </div>

        <div className="space-y-4">
          {blog.content.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm leading-7 text-muted-foreground first:text-base first:leading-8 first:text-foreground">
              {para}
            </p>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border/60">
            <Image src={blog.author.photo} alt={`Portrait of ${blog.author.fullName}`} fill sizes="48px" className="object-cover object-top" />
          </span>
          <div>
            <p className="text-sm font-semibold">{blog.author.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {blog.author.designation} • {blog.author.specialty.name} — BDHospital
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- Publish dialog

function PublishDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const doctors = useQuery({ queryKey: ["doctors", ""], queryFn: () => fetchDoctors(), enabled: open });
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("General Health");
  const [authorId, setAuthorId] = useState("");
  const [coverImage, setCoverImage] = useState(BLOG_COVERS[0]);
  const [content, setContent] = useState("");
  const [init, setInit] = useState(false);
  if (open && !init) {
    setInit(true);
    setTitle(""); setSummary(""); setCategory("General Health"); setAuthorId(""); setCoverImage(BLOG_COVERS[0]); setContent("");
  }
  if (!open && init) setInit(false);

  const mutation = useMutation({
    mutationFn: () => createBlog({ title, summary, content, category, coverImage, authorId: Number(authorId) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Health article published");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PenLine size={17} className="text-emerald-600" aria-hidden /> Publish a Health Article</DialogTitle>
          <DialogDescription>Share medical knowledge and wellness guidance with patients.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="b-title">Title *</Label>
            <Input id="b-title" placeholder="Article title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Author (Doctor) *</Label>
              <Select value={authorId} onValueChange={setAuthorId}>
                <SelectTrigger><SelectValue placeholder="Select author" /></SelectTrigger>
                <SelectContent>
                  {(doctors.data ?? []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-cat">Category</Label>
              <Input id="b-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Nutrition" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-summary">Summary *</Label>
            <Input id="b-summary" placeholder="One or two sentence summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex flex-wrap gap-2">
              {BLOG_COVERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCoverImage(c)}
                  aria-label={`Select cover ${c}`}
                  className={`relative h-12 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                    coverImage === c ? "border-emerald-600 ring-2 ring-emerald-600/30" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={c} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-content">Content * (separate paragraphs with a blank line)</Label>
            <Textarea id="b-content" rows={8} placeholder="Write the article content…" value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={mutation.isPending || !title || !summary || !content.trim() || !authorId}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 size={15} className="mr-1 animate-spin" aria-hidden />}
            Publish Article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ Main module

export function BlogsModule() {
  const qc = useQueryClient();
  const [reading, setReading] = useState<Blog | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const blogs = useQuery({ queryKey: ["blogs"], queryFn: fetchBlogs });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBlog(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Article deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Health Library</h3>
          <p className="text-sm text-muted-foreground">Articles written by BDHospital specialists</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setPublishOpen(true)}>
          <PenLine size={16} className="mr-1.5" aria-hidden /> Publish Article
        </Button>
      </div>

      {blogs.isLoading ? (
        <CardSkeleton count={4} />
      ) : (blogs.data ?? []).length === 0 ? (
        <EmptyState icon={Newspaper} title="No articles yet" description="Doctors can publish health articles to educate patients." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {(blogs.data ?? []).map((b) => (
            <Card key={b.id} className="group cursor-pointer gap-0 overflow-hidden border-border/60 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" onClick={() => setReading(b)}>
              <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted">
                <Image
                  src={b.coverImage}
                  alt={`Cover image for ${b.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
                <Badge className="absolute left-3 top-3 border-0 bg-slate-950/70 text-white backdrop-blur-sm">{b.category}</Badge>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(b.id); }}
                  aria-label={`Delete article ${b.title}`}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-rose-600 group-hover:opacity-100"
                >
                  {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Trash2 size={13} aria-hidden />}
                </button>
              </div>
              <CardContent className="space-y-2.5 p-5">
                <h4 className="line-clamp-2 font-semibold leading-snug">{b.title}</h4>
                <p className="line-clamp-2 text-sm text-muted-foreground">{b.summary}</p>
                <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border/60">
                      <Image src={b.author.photo} alt="" fill sizes="24px" className="object-cover object-top" />
                    </span>
                    <span className="truncate">{b.author.fullName}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="flex items-center gap-1"><Eye size={12} aria-hidden />{b.views}</span>
                    {formatDate(b.publishedAt.slice(0, 10))}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BlogReaderDialog blog={reading} onClose={() => setReading(null)} />
      <PublishDialog open={publishOpen} onClose={() => setPublishOpen(false)} />
    </div>
  );
}
