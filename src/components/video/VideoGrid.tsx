import VideoCard from "./VideoCard";
import type { VideoListItem } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  videos: VideoListItem[];
  className?: string;
  skeleton?: number;
}

export default function VideoGrid({ videos, className, skeleton }: Props) {
  if (skeleton && videos.length === 0) {
    return (
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4", className)}>
        {Array.from({ length: skeleton }).map((_, i) => (
          <div key={i}>
            <div className="skeleton rounded-lg aspect-video" />
            <div className="mt-2 space-y-2">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl mb-4">🎬</p>
        <p className="text-lg font-medium text-gray-300">No videos found</p>
        <p className="text-sm text-gray-500 mt-1">Try a different search or category.</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4", className)}>
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
