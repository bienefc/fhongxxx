import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { completeMultipartUpload, videoKeys } from "@/lib/s3";
import { z } from "zod";
import { Queue } from "bullmq";

const schema = z.object({
  videoId: z.string(),
  uploadId: z.string(),
  parts: z.array(z.object({ PartNumber: z.number(), ETag: z.string() })),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).default("PUBLIC"),
});

// BullMQ queue for transcoding jobs
let transcodeQueue: Queue | null = null;
function getQueue() {
  if (!transcodeQueue && process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);
    transcodeQueue = new Queue("transcode", {
      connection: {
        host: url.hostname,
        port: Number(url.port) || 6379,
        password: url.password || undefined,
      },
    });
  }
  return transcodeQueue;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const video = await prisma.video.findUnique({ where: { id: data.videoId } });
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (video.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const keys = videoKeys(data.videoId);

    // Complete multipart upload on S3
    await completeMultipartUpload(keys.original, data.uploadId, data.parts);

    // Upsert tags
    const tagRecords = data.tags
      ? await Promise.all(
          data.tags.map((name) => {
            const slug = name.toLowerCase().replace(/\s+/g, "-");
            return prisma.tag.upsert({
              where: { slug },
              create: { name, slug },
              update: {},
            });
          })
        )
      : [];

    // Update video record
    await prisma.$transaction(async (tx) => {
      await tx.video.update({
        where: { id: data.videoId },
        data: {
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          visibility: data.visibility,
          status: "PROCESSING",
          thumbnailKey: keys.thumbnail,
        },
      });

      if (tagRecords.length > 0) {
        await tx.videoTag.createMany({
          data: tagRecords.map((t) => ({ videoId: data.videoId, tagId: t.id })),
          skipDuplicates: true,
        });
      }

      await tx.transcodeJob.upsert({
        where: { videoId: data.videoId },
        create: { videoId: data.videoId, status: "queued" },
        update: { status: "queued" },
      });
    });

    // Enqueue transcoding job
    const queue = getQueue();
    if (queue) {
      await queue.add("transcode", { videoId: data.videoId }, { jobId: data.videoId });
    }

    return NextResponse.json({ videoId: data.videoId, status: "PROCESSING" });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
