import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { searchEporner } from "@/lib/eporner";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// POST /api/admin/import
// Body: { query, count, categoryId?, order? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { query = "", count = 20, categoryId, order = "most-popular" } = await req.json();
  const perPage = Math.min(100, Math.max(1, Number(count)));

  const data = await searchEporner({ query, perPage, order });

  if (!data.videos?.length) {
    return NextResponse.json({ imported: 0, skipped: 0, total: 0 });
  }

  let imported = 0;
  let skipped = 0;

  for (const v of data.videos) {
    // Skip if already imported
    const exists = await prisma.video.findFirst({
      where: { source: "eporner", externalId: v.id },
      select: { id: true },
    });
    if (exists) { skipped++; continue; }

    // Build unique slug
    let baseSlug = slugify(v.title) || `eporner-${v.id}`;
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.video.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${++attempt}`;
    }

    const tagNames = [...new Set((v.keywords || "").split(",").map((t) => t.trim()).filter(Boolean))];

    // Resolve tag IDs and deduplicate by ID to avoid VideoTag unique constraint errors
    const tagIds = [...new Set(await Promise.all(
      tagNames.slice(0, 10).map(async (name) => {
        const tagSlug = slugify(name) || name;
        const tag = await prisma.tag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name, slug: tagSlug },
        });
        return tag.id;
      })
    ))];

    await prisma.video.create({
      data: {
        title: v.title,
        slug,
        status: "READY",
        visibility: "PUBLIC",
        source: "eporner",
        externalId: v.id,
        embedUrl: v.embed,
        thumbnailUrl: v.default_thumb?.src ?? null,
        duration: v.length_sec || null,
        viewCount: v.views || 0,
        publishedAt: new Date(),
        authorId: session.user.id,
        ...(categoryId ? { categoryId } : {}),
        tags: tagIds.length > 0 ? {
          create: tagIds.map((tagId) => ({ tagId })),
        } : undefined,
      },
    });

    imported++;
  }

  return NextResponse.json({ imported, skipped, total: data.total_count });
}
