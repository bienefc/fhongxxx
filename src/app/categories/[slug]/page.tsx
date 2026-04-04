import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getVideos } from "@/lib/video-query";
import VideoGrid from "@/components/video/VideoGrid";
import Link from "next/link";

interface Props {
  params: { slug: string };
  searchParams: { sort?: string; page?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!cat) return { title: "Not Found" };
  return { title: `${cat.name} Videos`, description: cat.description || undefined };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const cat = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!cat) notFound();

  const sort = (searchParams.sort as any) || "newest";
  const page = Math.max(1, Number(searchParams.page || 1));

  const videos = await getVideos({ categorySlug: params.slug, sort, page, pageSize: 24 });

  const sorts = [
    { key: "newest", label: "Newest" },
    { key: "popular", label: "Most Viewed" },
    { key: "top-rated", label: "Top Rated" },
    { key: "trending", label: "Trending" },
  ];

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/categories" className="hover:text-brand-400 transition-colors">Categories</Link>
            <span>/</span>
            <span className="text-gray-300">{cat.name}</span>
          </div>
          <h1 className="text-3xl font-black">{cat.name}</h1>
          {cat.description && <p className="text-gray-400 mt-1">{cat.description}</p>}
          <p className="text-sm text-gray-500 mt-1">{videos.total.toLocaleString()} videos</p>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-6">
        {sorts.map(({ key, label }) => (
          <Link
            key={key}
            href={`/categories/${params.slug}?sort=${key}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              sort === key ? "bg-brand-500 text-white" : "bg-surface-600 text-gray-300 hover:bg-surface-500"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <VideoGrid videos={videos.items} />

      {/* Pagination */}
      {videos.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <Link href={`/categories/${params.slug}?sort=${sort}&page=${page - 1}`} className="btn-secondary">
              ← Prev
            </Link>
          )}
          <span className="flex items-center px-4 text-sm text-gray-400">
            Page {page} of {videos.totalPages}
          </span>
          {page < videos.totalPages && (
            <Link href={`/categories/${params.slug}?sort=${sort}&page=${page + 1}`} className="btn-secondary">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
