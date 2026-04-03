import prisma from "./prisma";
import { getPublicUrl } from "./s3";
import type { VideoListItem, VideoDetail, PaginatedResponse } from "@/types";

const videoSelect = {
  id: true,
  title: true,
  slug: true,
  thumbnailKey: true,
  previewKey: true,
  duration: true,
  viewCount: true,
  likeCount: true,
  status: true,
  visibility: true,
  publishedAt: true,
  createdAt: true,
  author: {
    select: { id: true, username: true, displayName: true, avatar: true },
  },
  category: {
    select: { id: true, name: true, slug: true },
  },
  tags: {
    select: { tag: { select: { name: true, slug: true } } },
  },
};

function mapVideo(v: any): VideoListItem {
  return {
    ...v,
    thumbnailUrl: v.thumbnailKey ? getPublicUrl(v.thumbnailKey) : null,
    previewUrl: v.previewKey ? getPublicUrl(v.previewKey) : null,
    tags: v.tags.map((t: any) => t.tag),
    createdAt: v.createdAt.toISOString(),
    publishedAt: v.publishedAt?.toISOString() ?? null,
  };
}

export async function getVideos({
  page = 1,
  pageSize = 24,
  categorySlug,
  tag,
  authorId,
  search,
  sort = "newest",
}: {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  tag?: string;
  authorId?: string;
  search?: string;
  sort?: "newest" | "popular" | "trending" | "top-rated";
}): Promise<PaginatedResponse<VideoListItem>> {
  const where: any = {
    status: "READY",
    visibility: "PUBLIC",
  };

  if (categorySlug) where.category = { slug: categorySlug };
  if (tag) where.tags = { some: { tag: { slug: tag } } };
  if (authorId) where.authorId = authorId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: search, mode: "insensitive" } } } } },
    ];
  }

  const orderBy: any =
    sort === "popular"
      ? { viewCount: "desc" }
      : sort === "trending"
      ? [{ viewCount: "desc" }, { createdAt: "desc" }]
      : sort === "top-rated"
      ? { likeCount: "desc" }
      : { createdAt: "desc" };

  const [total, items] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      select: videoSelect,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: items.map(mapVideo),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getVideoBySlug(slug: string, userId?: string): Promise<VideoDetail | null> {
  const v = await prisma.video.findUnique({
    where: { slug },
    select: {
      ...videoSelect,
      description: true,
      hlsKey: true,
      width: true,
      height: true,
      fileSize: true,
      commentCount: true,
    },
  });

  if (!v) return null;

  const userLiked = userId
    ? !!(await prisma.like.findUnique({
        where: { userId_videoId: { userId, videoId: v.id } },
      }))
    : false;

  return {
    ...mapVideo(v),
    description: v.description,
    hlsUrl: v.hlsKey ? getPublicUrl(v.hlsKey) : null,
    width: v.width,
    height: v.height,
    fileSize: v.fileSize ? Number(v.fileSize) : null,
    commentCount: v.commentCount,
    userLiked,
  };
}
