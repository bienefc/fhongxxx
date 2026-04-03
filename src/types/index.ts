export type VideoStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
export type UserRole = "USER" | "CREATOR" | "ADMIN";

export interface VideoListItem {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  duration: number | null;
  viewCount: number;
  likeCount: number;
  status: VideoStatus;
  visibility: Visibility;
  publishedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: { name: string; slug: string }[];
}

export interface VideoDetail extends VideoListItem {
  description: string | null;
  hlsUrl: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  commentCount: number;
  userLiked?: boolean;
}

export interface CommentWithAuthor {
  id: string;
  body: string;
  likeCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  replies?: CommentWithAuthor[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  videoCount: number;
}

export interface UploadInitiateResponse {
  uploadId: string;
  videoId: string;
  parts: { partNumber: number; presignedUrl: string }[];
  thumbnailUploadUrl: string;
}

export interface UploadCompleteRequest {
  videoId: string;
  uploadId: string;
  parts: { PartNumber: number; ETag: string }[];
  title: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  visibility?: Visibility;
}
