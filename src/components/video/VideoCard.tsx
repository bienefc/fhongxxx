"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Clock, Eye, Heart } from "lucide-react";
import { formatDuration, formatCount, timeAgo, cn } from "@/lib/utils";
import type { VideoListItem } from "@/types";

interface Props {
  video: VideoListItem;
  className?: string;
}

export default function VideoCard({ video, className }: Props) {
  const [hovering, setHovering] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  const thumb = video.thumbnailUrl && !thumbError ? video.thumbnailUrl : null;
  const preview = video.previewUrl;

  return (
    <div className={cn("group", className)}>
      {/* Thumbnail */}
      <Link href={`/videos/${video.slug}`}>
        <div
          className="relative rounded-lg overflow-hidden bg-surface-700 aspect-video cursor-pointer"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {/* Thumbnail image */}
          {thumb ? (
            <Image
              src={thumb}
              alt={video.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-transform duration-300 group-hover:scale-105",
                hovering && preview ? "opacity-0" : "opacity-100"
              )}
              onError={() => setThumbError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-800">
              <Play size={32} className="text-gray-600" />
            </div>
          )}

          {/* Preview video on hover */}
          {hovering && preview && (
            <video
              src={preview}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-12 h-12 rounded-full bg-brand-500/90 flex items-center justify-center">
              <Play size={20} fill="white" className="text-white ml-1" />
            </div>
          </div>

          {/* Duration badge */}
          {video.duration != null && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
              {formatDuration(video.duration)}
            </div>
          )}

        </div>
      </Link>

      {/* Meta */}
      <div className="mt-2 px-0.5">
        <Link href={`/videos/${video.slug}`}>
          <h3 className="text-sm font-medium text-gray-100 line-clamp-2 leading-snug group-hover:text-brand-400 transition-colors">
            {video.title}
          </h3>
        </Link>

          <div className="flex items-center justify-between mt-1.5">
            <Link
              href={`/profile/${video.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-gray-400 hover:text-brand-400 transition-colors truncate max-w-[120px]"
            >
              {video.author.displayName || video.author.username}
            </Link>

            <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {formatCount(video.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={11} />
                {formatCount(video.likeCount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {video.category && (
              <Link
                href={`/categories/${video.category.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] bg-surface-600 hover:bg-surface-500 text-gray-400 hover:text-gray-200 px-2 py-0.5 rounded-full transition-colors"
              >
                {video.category.name}
              </Link>
            )}
            <span className="text-[10px] text-gray-600 ml-auto">{timeAgo(video.createdAt)}</span>
          </div>
        </div>
    </div>
  );
}
