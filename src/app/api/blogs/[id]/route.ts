import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isRecordNotFound, parseIdParam } from "@/lib/validation";

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
};

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/blogs/[id] — fetch a blog (increments its view counter)
export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid blog id" }, { status: 400 });
    }

    const blog = await db.blog.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: blogInclude,
    });

    return NextResponse.json({ blog });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    console.error("GET /api/blogs/[id] failed:", error);
    return NextResponse.json({ error: "Failed to load blog" }, { status: 500 });
  }
}

// DELETE /api/blogs/[id]
export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const { id: rawId } = await ctx.params;
    const id = parseIdParam(rawId);
    if (id === null) {
      return NextResponse.json({ error: "Invalid blog id" }, { status: 400 });
    }

    await db.blog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    console.error("DELETE /api/blogs/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}
