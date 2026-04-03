import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { videoId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [video, job] = await Promise.all([
    prisma.video.findUnique({
      where: { id: params.videoId },
      select: { id: true, status: true, slug: true, authorId: true },
    }),
    prisma.transcodeJob.findUnique({ where: { videoId: params.videoId } }),
  ]);

  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (video.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    videoId: video.id,
    status: video.status,
    slug: video.slug,
    job: job
      ? { status: job.status, progress: job.progress, error: job.error }
      : null,
  });
}
