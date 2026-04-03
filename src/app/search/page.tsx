import type { Metadata } from "next";
import { getVideos } from "@/lib/video-query";
import VideoGrid from "@/components/video/VideoGrid";
import Link from "next/link";

interface Props {
  searchParams: { q?: string; sort?: string; page?: string; category?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return { title: searchParams.q ? `Search: ${searchParams.q}` : "Search" };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || "";
  const sort = (searchParams.sort as any) || "newest";
  const page = Math.max(1, Number(searchParams.page || 1));
  const category = searchParams.category;

  const results = await getVideos({
    search: query || undefined,
    sort,
    page,
    pageSize: 24,
    categorySlug: category,
  });

  const sorts = [
    { key: "newest", label: "Newest" },
    { key: "popular", label: "Most Viewed" },
    { key: "top-rated", label: "Top Rated" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          {query ? (
            <>Search results for <span className="text-brand-400">"{query}"</span></>
          ) : (
            "All Videos"
          )}
        </h1>
        <p className="text-sm text-gray-400">{results.total.toLocaleString()} videos found</p>
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-6">
        {sorts.map(({ key, label }) => (
          <Link
            key={key}
            href={`/search?${new URLSearchParams({ q: query, sort: key, ...(category ? { category } : {}) })}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              sort === key ? "bg-brand-500 text-white" : "bg-surface-600 text-gray-300 hover:bg-surface-500"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <VideoGrid videos={results.items} />

      {results.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <Link
              href={`/search?${new URLSearchParams({ q: query, sort, page: String(page - 1) })}`}
              className="btn-secondary"
            >
              ← Prev
            </Link>
          )}
          <span className="flex items-center px-4 text-sm text-gray-400">
            Page {page} of {results.totalPages}
          </span>
          {page < results.totalPages && (
            <Link
              href={`/search?${new URLSearchParams({ q: query, sort, page: String(page + 1) })}`}
              className="btn-secondary"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
