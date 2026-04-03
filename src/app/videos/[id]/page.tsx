import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVideoBySlug, getVideos } from "@/lib/video-query";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoGrid from "@/components/video/VideoGrid";
import CommentsSection from "@/components/video/CommentsSection";
import LikeButton from "@/components/video/LikeButton";
import { formatCount, formatDuration, timeAgo, formatBytes } from "@/lib/utils";
import { Eye, Clock, Tag, User, Calendar, Download } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  const video = await getVideoBySlug(params.id, session?.user.id);
  if (!video) return { title: "Not Found" };
  return {
    title: video.title,
    description: video.description || `Watch ${video.title} on FhongXXX`,
    openGraph: {
      title: video.title,
      images: video.thumbnailUrl ? [video.thumbnailUrl] : [],
    },
  };
}

export default async function VideoPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const [video, related] = await Promise.all([
    getVideoBySlug(params.id, session?.user.id),
    getVideos({ sort: "trending", pageSize: 12 }),
  ]);

  if (!video || video.status !== "READY") notFound();

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        {/* Main column */}
        <div>
          {/* Player */}
          <div className="rounded-xl overflow-hidden bg-black shadow-2xl">
            {video.hlsUrl ? (
              <VideoPlayer
                hlsUrl={video.hlsUrl}
                thumbnailUrl={video.thumbnailUrl}
                videoId={video.id}
                title={video.title}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center bg-surface-800">
                <p className="text-gray-400">Video not available</p>
              </div>
            )}
          </div>

          {/* Title & meta */}
          <div className="mt-4">
            <h1 className="text-xl font-bold text-white leading-tight mb-3">{video.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-700">
              {/* Stats */}
              <div className="flex items-center gap-5 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Eye size={15} /> {formatCount(video.viewCount)} views
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} />
                  {video.duration ? formatDuration(video.duration) : "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} />
                  {timeAgo(video.publishedAt || video.createdAt)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <LikeButton
                  videoId={video.id}
                  initialLiked={video.userLiked || false}
                  initialCount={video.likeCount}
                />
              </div>
            </div>

            {/* Author & category */}
            <div className="flex flex-wrap items-center gap-4 py-4 border-b border-surface-700">
              <Link
                href={`/profile/${video.author.username}`}
                className="flex items-center gap-2 hover:text-brand-400 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center font-bold uppercase text-sm">
                  {video.author.username[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{video.author.displayName || video.author.username}</p>
                  <p className="text-xs text-gray-400">@{video.author.username}</p>
                </div>
              </Link>

              {video.category && (
                <Link
                  href={`/categories/${video.category.slug}`}
                  className="badge-orange hover:bg-brand-500/30 transition-colors"
                >
                  {video.category.name}
                </Link>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <div className="py-4 border-b border-surface-700">
                <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="py-4 border-b border-surface-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag size={14} className="text-gray-500" />
                  {video.tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/search?q=${encodeURIComponent(tag.name)}`}
                      className="text-xs px-3 py-1 rounded-full bg-surface-600 hover:bg-brand-500/20 hover:text-brand-400 text-gray-300 transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Technical info */}
            <div className="py-4 text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
              {video.width && video.height && <span>{video.width}×{video.height}</span>}
              {video.fileSize && <span>{formatBytes(video.fileSize)}</span>}
            </div>
          </div>

          {/* Comments */}
          <div className="mt-6">
            <CommentsSection videoId={video.id} commentCount={video.commentCount} />
          </div>
        </div>

        {/* Sidebar — related */}
        <aside>
          <h2 className="font-semibold text-gray-300 mb-4 text-sm uppercase tracking-wide">Related Videos</h2>
          <div className="space-y-4">
            {related.items.filter((v) => v.id !== video.id).slice(0, 10).map((v) => (
              <RelatedVideoCard key={v.id} video={v} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function RelatedVideoCard({ video }: { video: any }) {
  return (
    <Link href={`/videos/${video.slug}`} className="flex gap-3 group">
      <div className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-surface-700">
        {video.thumbnailUrl && (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        )}
        {video.duration && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-200 line-clamp-2 group-hover:text-brand-400 transition-colors leading-snug">
          {video.title}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {video.author.displayName || video.author.username}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">{formatCount(video.viewCount)} views</p>
      </div>
    </Link>
  );
}
