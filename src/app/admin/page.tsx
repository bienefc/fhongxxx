import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPanel from "@/components/admin/AdminPanel";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const [totalVideos, pendingVideos, totalUsers, recentVideos] = await Promise.all([
    prisma.video.count(),
    prisma.video.count({ where: { status: "PROCESSING" } }),
    prisma.user.count(),
    prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        viewCount: true,
        createdAt: true,
        author: { select: { username: true } },
      },
    }),
  ]);

  const stats = { totalVideos, pendingVideos, totalUsers };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-8 text-brand-400">Admin Panel</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Videos", value: stats.totalVideos.toLocaleString(), color: "text-blue-400" },
          { label: "Processing", value: stats.pendingVideos.toLocaleString(), color: "text-yellow-400" },
          { label: "Total Users", value: stats.totalUsers.toLocaleString(), color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <AdminPanel initialVideos={recentVideos as any} />
    </div>
  );
}
