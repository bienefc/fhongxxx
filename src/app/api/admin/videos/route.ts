import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function requireAdmin(session: any) {
  if (!session || session.user.role !== "ADMIN") return false;
  return true;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 20;
  const status = searchParams.get("status") || undefined;

  const where: any = {};
  if (status) where.status = status;

  const [total, videos] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        visibility: true,
        viewCount: true,
        createdAt: true,
        author: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ items: videos, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

// PATCH /api/admin/videos — bulk update (approve, reject)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ids, action } = await req.json();
  if (!Array.isArray(ids) || !["approve", "reject", "delete"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (action === "delete") {
    await prisma.video.deleteMany({ where: { id: { in: ids } } });
  } else {
    await prisma.video.updateMany({
      where: { id: { in: ids } },
      data: {
        status: action === "approve" ? "READY" : "FAILED",
        visibility: action === "approve" ? "PUBLIC" : "PRIVATE",
        publishedAt: action === "approve" ? new Date() : undefined,
      },
    });
  }

  return NextResponse.json({ success: true, affected: ids.length });
}
