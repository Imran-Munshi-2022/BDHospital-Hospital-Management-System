import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { readJsonBody, zodErrorMessage } from "@/lib/validation";

const blogInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      photo: true,
      designation: true,
      specialty: { select: { name: true } },
    },
  },
} satisfies Prisma.BlogInclude;

const createBlogSchema = z.object({
  title: z.string().min(1, "title is required"),
  summary: z.string().min(1, "summary is required"),
  content: z.string().min(1, "content is required"),
  category: z.string().default("General Health"),
  coverImage: z.string().min(1, "coverImage is required"),
  authorId: z.coerce.number().int().positive("authorId must be a positive integer"),
});

// GET /api/blogs — all blogs, newest first
export async function GET() {
  try {
    const blogs = await db.blog.findMany({
      include: blogInclude,
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error("GET /api/blogs failed:", error);
    return NextResponse.json({ error: "Failed to load blogs" }, { status: 500 });
  }
}

// POST /api/blogs — publish a new health article
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

    const parsed = createBlogSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;

    const author = await db.doctor.findUnique({ where: { id: data.authorId } });
    if (!author) {
      return NextResponse.json({ error: "Author (doctor) not found" }, { status: 400 });
    }

    const blog = await db.blog.create({ data, include: blogInclude });
    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    console.error("POST /api/blogs failed:", error);
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}
