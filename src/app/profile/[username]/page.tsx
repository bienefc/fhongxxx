import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getVideos } from "@/lib/video-query";
import VideoGrid from "@/components/video/VideoGrid";
import { formatCount, timeAgo } from "@/lib/utils";
import { Calendar, Film, Eye, Heart } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { username: string };
  searchParams: { sort?: string; page?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({ where: { username: params.username } });
  if (!user) return { title: "Not Found" };
  return { title: `${user.displayName || user.username}'s Profile` };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      _count: { select: { videos: true, subscribers: true } },
    },
  });
  if (!user) notFound();

  const sort = (searchParams.sort as any) || "newest";
  const page = Math.max(1, Number(searchParams.page || 1));

  const [videos, stats] = await Promise.all([
    getVideos({ authorId: user.id, sort, page, pageSize: 24 }),
    prisma.video.aggregate({
      where: { authorId: user.id, status: "READY" },
      _sum: { viewCount: true, likeCount: true },
    }),
  ]);

  const sorts = [
    { key: "newest", label: "Newest" },
    { key: "popular", label: "Most Viewed" },
    { key: "top-rated", label: "Most Liked" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-8 pb-8 border-b border-surface-700">
        <div className="w-24 h-24 rounded-full bg-brand-600 flex items-center justify-center text-4xl font-black uppercase flex-shrink-0">
          {user.username[0]}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-black">{user.displayName || user.username}</h1>
          <p className="text-gray-400 text-sm">@{user.username}</p>
          {user.bio && <p className="text-gray-300 mt-2 max-w-2xl">{user.bio}</p>}

          <div className="flex flex-wrap gap-6 mt-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Film size={14} />
              <span className="font-semibold text-white">{formatCount(videos.total)}</span> videos
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Eye size={14} />
              <span className="font-semibold text-white">{formatCount(stats._sum.viewCount || 0)}</span> total views
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Heart size={14} />
              <span className="font-semibold text-white">{formatCount(stats._sum.likeCount || 0)}</span> total likes
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar size={14} />
              Joined <span className="font-semibold text-white ml-1">{timeAgo(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Videos */}
      <div className="flex gap-2 mb-6">
        {sorts.map(({ key, label }) => (
          <Link
            key={key}
            href={`/profile/${params.username}?sort=${key}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              sort === key ? "bg-brand-500 text-white" : "bg-surface-600 text-gray-300 hover:bg-surface-500"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <VideoGrid videos={videos.items} />

      {videos.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <Link href={`/profile/${params.username}?sort=${sort}&page=${page - 1}`} className="btn-secondary">
              ← Prev
            </Link>
          )}
          <span className="flex items-center px-4 text-sm text-gray-400">
            Page {page} of {videos.totalPages}
          </span>
          {page < videos.totalPages && (
            <Link href={`/profile/${params.username}?sort=${sort}&page=${page + 1}`} className="btn-secondary">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
