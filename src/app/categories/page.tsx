import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getPublicUrl } from "@/lib/s3";
import { formatCount } from "@/lib/utils";

export const metadata: Metadata = { title: "Categories" };
export const revalidate = 3600;

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { videoCount: "desc" },
  });

  return (
    <div>
      <h1 className="text-3xl font-black mb-2">Categories</h1>
      <p className="text-gray-400 mb-8">Browse {categories.length} categories</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/categories/${cat.slug}`} className="group">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-surface-700 border border-surface-600 group-hover:border-brand-500 transition-all duration-200">
              {cat.thumbnail ? (
                <img
                  src={getPublicUrl(cat.thumbnail)}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  🎬
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-sm font-bold text-white truncate">{cat.name}</p>
                <p className="text-[10px] text-gray-300">{formatCount(cat.videoCount)} videos</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
