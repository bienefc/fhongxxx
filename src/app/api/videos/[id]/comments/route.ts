import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const commentSelect = {
  id: true,
  body: true,
  likeCount: true,
  createdAt: true,
  parentId: true,
  author: { select: { id: true, username: true, displayName: true, avatar: true } },
};

// GET /api/videos/:id/comments
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 20;

  try {
    const [total, comments] = await Promise.all([
      prisma.comment.count({ where: { videoId: params.id, parentId: null } }),
      prisma.comment.findMany({
        where: { videoId: params.id, parentId: null },
        select: {
          ...commentSelect,
          replies: {
            select: commentSelect,
            orderBy: { createdAt: "asc" },
            take: 10,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      items: comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        replies: c.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const postSchema = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

// POST /api/videos/:id/comments
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Login to comment" }, { status: 401 });

  try {
    const body = await req.json();
    const { body: text, parentId } = postSchema.parse(body);

    const video = await prisma.video.findUnique({ where: { id: params.id } });
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: { body: text, videoId: params.id, authorId: session.user.id, parentId },
        select: {
          ...commentSelect,
          replies: { select: commentSelect },
        },
      });
      await tx.video.update({
        where: { id: params.id },
        data: { commentCount: { increment: 1 } },
      });
      return c;
    });

    return NextResponse.json({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      replies: [],
    }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
