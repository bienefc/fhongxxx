import { NextRequest, NextResponse } from "next/server";
import { getVideos } from "@/lib/video-query";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(48, Math.max(12, Number(searchParams.get("pageSize") || 24)));
  const category = searchParams.get("category") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const author = searchParams.get("author") || undefined;
  const search = searchParams.get("q") || undefined;
  const sort = (searchParams.get("sort") as any) || "newest";

  try {
    const result = await getVideos({
      page,
      pageSize,
      categorySlug: category,
      tag,
      authorId: author,
      search,
      sort,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
