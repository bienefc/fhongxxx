const EPORNER_API = "https://www.eporner.com/api/v2";

export interface EpornerVideo {
  id: string;
  title: string;
  url: string;
  embed: string;
  length_sec: number;
  views: number;
  rate: string;
  keywords: string; // comma-separated tags
  default_thumb: { src: string; width: number; height: number };
}

interface EpornerSearchResponse {
  videos: EpornerVideo[];
  total_count: number;
  page: number;
  per_page: number;
}

export async function searchEporner({
  query = "",
  perPage = 20,
  page = 1,
  order = "most-popular",
}: {
  query?: string;
  perPage?: number;
  page?: number;
  order?: "top-rated" | "most-popular" | "newest" | "longest";
}): Promise<EpornerSearchResponse> {
  const params = new URLSearchParams({
    query,
    per_page: String(Math.min(100, perPage)),
    page: String(page),
    format: "json",
    thumbsize: "medium",
    order,
  });

  const res = await fetch(`${EPORNER_API}/video/search/?${params}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Eporner API error: ${res.status}`);
  }

  return res.json();
}
