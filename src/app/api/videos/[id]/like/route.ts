import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Login to like" }, { status: 401 });

  try {
    const existing = await prisma.like.findUnique({
      where: { userId_videoId: { userId: session.user.id, videoId: params.id } },
    });

    if (existing) {
      // Unlike
      await prisma.$transaction([
        prisma.like.delete({
          where: { userId_videoId: { userId: session.user.id, videoId: params.id } },
        }),
        prisma.video.update({
          where: { id: params.id },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.$transaction([
        prisma.like.create({
          data: { userId: session.user.id, videoId: params.id },
        }),
        prisma.video.update({
          where: { id: params.id },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
