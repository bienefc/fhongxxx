import Link from "next/link";
import prisma from "@/lib/prisma";

interface Props {
  totalVideos?: number;
  activeSlug?: string;
}

export default async function CategorySidebar({ totalVideos, activeSlug }: Props) {
  const [categories, total] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, take: 60 }),
    totalVideos !== undefined
      ? Promise.resolve(totalVideos)
      : prisma.video.count({ where: { status: "READY" } }),
  ]);

  return (
    <aside className="hidden lg:flex flex-col w-52 shrink-0">
      <nav className="bg-surface-800 rounded-xl border border-surface-700 overflow-hidden sticky top-4">
        {/* All videos */}
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 border-b border-surface-700 hover:bg-surface-700 transition-colors group"
        >
          <span className="text-sm font-semibold text-gray-300 group-hover:text-white">All</span>
          <span className="text-xs text-gray-400 group-hover:text-gray-200 font-medium">
            {total.toLocaleString()}
          </span>
        </Link>

        {/* Categories header */}
        <div className="px-3 py-1.5 bg-surface-900/50">
          <span className="text-[10px] font-bold tracking-widest text-yellow-400 uppercase">
            Categories
          </span>
        </div>

        {/* All categories link */}
        <Link
          href="/categories"
          className={`flex items-center justify-between px-3 py-1.5 border-b border-surface-700/50 hover:bg-surface-700 transition-colors group ${
            activeSlug === "" ? "bg-surface-700" : ""
          }`}
        >
          <span
            className={`text-sm font-medium ${
              activeSlug === "" ? "text-brand-400" : "text-brand-400/80 group-hover:text-brand-400"
            }`}
          >
            All
          </span>
          <span className="text-xs text-brand-400/70 group-hover:text-brand-400">
            {total.toLocaleString()}
          </span>
        </Link>

        {/* Category list */}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-surface-800 scrollbar-thumb-surface-600">
          {categories.map((cat) => {
            const isActive = cat.slug === activeSlug;
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={`flex items-center justify-between px-3 py-1.5 hover:bg-surface-700 transition-colors group ${
                  isActive ? "bg-surface-700" : ""
                }`}
              >
                <span
                  className={`text-sm truncate transition-colors ${
                    isActive ? "text-brand-400" : "text-gray-300 group-hover:text-white"
                  }`}
                >
                  {cat.name}
                </span>
                <span
                  className={`text-xs ml-2 shrink-0 transition-colors ${
                    isActive ? "text-brand-400" : "text-gray-500 group-hover:text-gray-300"
                  }`}
                >
                  {cat.videoCount.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
