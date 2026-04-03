import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import VideoUploader from "@/components/video/VideoUploader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Upload Video" };

export default async function UploadPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Upload Video</h1>
        <p className="text-gray-400">
          Share your content with millions of viewers. All performers must be 18+.
        </p>
      </div>

      <VideoUploader categories={categories} />
    </div>
  );
}
