import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getVideoBySlug } from "@/lib/video-query";
import { deleteObject, videoKeys } from "@/lib/s3";
import { z } from "zod";

// GET /api/videos/:slug
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  try {
    const video = await getVideoBySlug(params.id, session?.user.id);
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(video);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/videos/:id — update metadata (owner or admin)
const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (video.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      if (data.tags !== undefined) {
        // Upsert tags and reconnect
        const tagRecords = await Promise.all(
          data.tags.map((name) => {
            const slug = name.toLowerCase().replace(/\s+/g, "-");
            return tx.tag.upsert({
              where: { slug },
              create: { name, slug },
              update: {},
            });
          })
        );
        await tx.videoTag.deleteMany({ where: { videoId: params.id } });
        await tx.videoTag.createMany({
          data: tagRecords.map((t) => ({ videoId: params.id, tagId: t.id })),
        });
      }

      return tx.video.update({
        where: { id: params.id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.visibility && { visibility: data.visibility }),
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/videos/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (video.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Delete S3 objects
    const keys = videoKeys(params.id);
    await Promise.allSettled([
      video.originalKey && deleteObject(video.originalKey),
      video.thumbnailKey && deleteObject(video.thumbnailKey),
      video.previewKey && deleteObject(video.previewKey),
      // HLS segments would need to be listed and deleted in bulk
    ]);

    await prisma.video.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
