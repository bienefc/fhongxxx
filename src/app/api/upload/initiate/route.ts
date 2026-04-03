import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { initiateMultipartUpload, getPresignedPutUrl, videoKeys, BUCKET } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { UPLOAD_CHUNK_SIZE, ALLOWED_VIDEO_TYPES } from "@/lib/utils";

const schema = z.object({
  fileName: z.string(),
  fileSize: z.number().min(1).max(10 * 1024 * 1024 * 1024), // 10 GB
  mimeType: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { fileName, fileSize, mimeType } = schema.parse(body);

    if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const videoId = uuidv4();
    const keys = videoKeys(videoId);
    const partCount = Math.ceil(fileSize / UPLOAD_CHUNK_SIZE);

    const { uploadId, presignedUrls } = await initiateMultipartUpload(
      keys.original,
      mimeType,
      partCount
    );

    const thumbnailUploadUrl = await getPresignedPutUrl(keys.thumbnail, "image/jpeg");

    // Create video record in DB
    await prisma.video.create({
      data: {
        id: videoId,
        title: fileName.replace(/\.[^/.]+$/, ""),
        slug: `${videoId}`,
        status: "PENDING",
        visibility: "PRIVATE",
        authorId: session.user.id,
        originalKey: keys.original,
        mimeType,
        fileSize: BigInt(fileSize),
      },
    });

    return NextResponse.json({
      videoId,
      uploadId,
      parts: presignedUrls.map((url, i) => ({ partNumber: i + 1, presignedUrl: url })),
      thumbnailUploadUrl,
    });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
