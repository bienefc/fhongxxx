import { Suspense } from "react";
import Link from "next/link";
import { Flame, Clock, TrendingUp, Star } from "lucide-react";
import { getVideos } from "@/lib/video-query";
import prisma from "@/lib/prisma";
import VideoGrid from "@/components/video/VideoGrid";
import { getPublicUrl } from "@/lib/s3";

export const revalidate = 60;

const SORT_TABS = [
  { key: "newest", label: "New", icon: Clock },
  { key: "trending", label: "Trending", icon: TrendingUp },
  { key: "popular", label: "Most Viewed", icon: Flame },
  { key: "top-rated", label: "Top Rated", icon: Star },
] as const;

interface Props {
  searchParams: { sort?: string; page?: string };
}

export default async function HomePage({ searchParams }: Props) {
  const sort = (searchParams.sort as any) || "newest";
  const page = Math.max(1, Number(searchParams.page || 1));

  const [videos, categories] = await Promise.all([
    getVideos({ sort, page, pageSize: 24 }),
    prisma.category.findMany({ orderBy: { videoCount: "desc" }, take: 20 }),
  ]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Hero categories */}
      <section className="mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div className="w-24 h-16 rounded-xl bg-surface-700 border border-surface-600 group-hover:border-brand-500 transition-colors overflow-hidden relative">
                {cat.thumbnail ? (
                  <img src={getPublicUrl(cat.thumbnail)} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🎬
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-brand-400 transition-colors font-medium">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Sort tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-surface-700 pb-4">
        {SORT_TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/?sort=${key}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === key
                ? "bg-brand-500 text-white"
                : "text-gray-400 hover:text-white hover:bg-surface-700"
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}

        <span className="ml-auto text-sm text-gray-500">
          {videos.total.toLocaleString()} videos
        </span>
      </div>

      {/* Video grid */}
      <Suspense fallback={<VideoGrid videos={[]} skeleton={24} />}>
        <VideoGrid videos={videos.items} />
      </Suspense>

      {/* Pagination */}
      {videos.totalPages > 1 && (
        <Pagination current={page} total={videos.totalPages} sort={sort} />
      )}
    </div>
  );
}

function Pagination({ current, total, sort }: { current: number; total: number; sort: string }) {
  const pages = [];
  const range = 2;
  for (let i = Math.max(1, current - range); i <= Math.min(total, current + range); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      {current > 1 && (
        <Link href={`/?sort=${sort}&page=${current - 1}`} className="btn-secondary px-4 py-2 text-sm">
          ← Prev
        </Link>
      )}

      {pages[0] > 1 && (
        <>
          <Link href={`/?sort=${sort}&page=1`} className="btn-ghost w-9 h-9 text-sm">1</Link>
          {pages[0] > 2 && <span className="text-gray-500">...</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={`/?sort=${sort}&page=${p}`}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            p === current ? "bg-brand-500 text-white" : "btn-ghost"
          }`}
        >
          {p}
        </Link>
      ))}

      {pages[pages.length - 1] < total && (
        <>
          {pages[pages.length - 1] < total - 1 && <span className="text-gray-500">...</span>}
          <Link href={`/?sort=${sort}&page=${total}`} className="btn-ghost w-9 h-9 text-sm">{total}</Link>
        </>
      )}

      {current < total && (
        <Link href={`/?sort=${sort}&page=${current + 1}`} className="btn-secondary px-4 py-2 text-sm">
          Next →
        </Link>
      )}
    </div>
  );
}
