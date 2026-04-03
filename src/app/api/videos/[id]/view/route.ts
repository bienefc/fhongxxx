import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hashIp } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ipHash = hashIp(ip);

  try {
    const video = await prisma.video.findUnique({
      where: { id: params.id, status: "READY", visibility: "PUBLIC" },
    });
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Debounce: don't count the same ip/user within 1 hour
    const recent = await prisma.view.findFirst({
      where: {
        videoId: params.id,
        ...(session?.user.id ? { userId: session.user.id } : { ipHash }),
        createdAt: { gte: new Date(Date.now() - 3600_000) },
      },
    });

    if (!recent) {
      await prisma.$transaction([
        prisma.view.create({
          data: {
            videoId: params.id,
            userId: session?.user.id,
            ipHash: session?.user.id ? undefined : ipHash,
            userAgent: req.headers.get("user-agent") || undefined,
          },
        }),
        prisma.video.update({
          where: { id: params.id },
          data: { viewCount: { increment: 1 } },
        }),
      ]);
    }

    return NextResponse.json({ counted: !recent });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
