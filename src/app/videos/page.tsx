import type { Metadata } from "next";
import { getVideos } from "@/lib/video-query";
import VideoGrid from "@/components/video/VideoGrid";
import Link from "next/link";

export const metadata: Metadata = { title: "All Videos" };

interface Props {
  searchParams: { sort?: string; page?: string };
}

export default async function VideosPage({ searchParams }: Props) {
  const sort = (searchParams.sort as any) || "newest";
  const page = Math.max(1, Number(searchParams.page || 1));
  const videos = await getVideos({ sort, page, pageSize: 24 });

  const sorts = [
    { key: "newest", label: "Newest" },
    { key: "trending", label: "Trending" },
    { key: "popular", label: "Most Viewed" },
    { key: "top-rated", label: "Top Rated" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">All Videos</h1>
        <div className="flex gap-2">
          {sorts.map(({ key, label }) => (
            <Link
              key={key}
              href={`/videos?sort=${key}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sort === key ? "bg-brand-500 text-white" : "bg-surface-600 text-gray-300 hover:bg-surface-500"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <VideoGrid videos={videos.items} />

      {videos.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && <Link href={`/videos?sort=${sort}&page=${page - 1}`} className="btn-secondary">← Prev</Link>}
          <span className="flex items-center px-4 text-sm text-gray-400">Page {page} of {videos.totalPages}</span>
          {page < videos.totalPages && <Link href={`/videos?sort=${sort}&page=${page + 1}`} className="btn-secondary">Next →</Link>}
        </div>
      )}
    </div>
  );
}
