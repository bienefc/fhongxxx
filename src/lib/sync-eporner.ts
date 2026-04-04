import prisma from "./prisma";
import { searchEporner } from "./eporner";

const MAX_PAGES = 10;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function runEpornerSync(): Promise<{ imported: number; skipped: number }> {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (!admin) throw new Error("No admin user found");

  let imported = 0;
  let skipped = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await searchEporner({ perPage: 100, page, order: "newest" });

    if (!data.videos?.length) break;

    let allExist = true;

    for (const v of data.videos) {
      const exists = await prisma.video.findFirst({
        where: { source: "eporner", externalId: v.id },
        select: { id: true },
      });

      if (exists) { skipped++; continue; }

      allExist = false;

      let baseSlug = slugify(v.title) || `eporner-${v.id}`;
      let slug = baseSlug;
      let attempt = 0;
      while (await prisma.video.findUnique({ where: { slug }, select: { id: true } })) {
        slug = `${baseSlug}-${++attempt}`;
      }

      const tagNames = [...new Set((v.keywords || "").split(",").map((t) => t.trim()).filter(Boolean))];

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
          authorId: admin.id,
          tags: tagIds.length > 0 ? {
            create: tagIds.map((tagId) => ({ tagId })),
          } : undefined,
        },
      });

      imported++;
    }

    if (allExist) break;
  }

  console.log(`[sync-eporner] imported=${imported} skipped=${skipped}`);
  return { imported, skipped };
}
