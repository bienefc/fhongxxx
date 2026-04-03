import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  ...(process.env.AWS_ENDPOINT_URL
    ? {
        endpoint: process.env.AWS_ENDPOINT_URL,
        forcePathStyle: true,
      }
    : {}),
});

export const BUCKET = process.env.AWS_BUCKET_NAME!;
const CDN = process.env.CDN_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function getPublicUrl(key: string): string {
  if (CDN) return `${CDN}/${key}`;
  const endpoint = process.env.AWS_ENDPOINT_URL;
  if (endpoint) return `${endpoint}/${BUCKET}/${key}`;
  return `https://${BUCKET}.s3.amazonaws.com/${key}`;
}

export function videoKeys(videoId: string) {
  return {
    original: `videos/${videoId}/original`,
    hls: `videos/${videoId}/hls/playlist.m3u8`,
    hlsDir: `videos/${videoId}/hls/`,
    thumbnail: `videos/${videoId}/thumbnail.jpg`,
    preview: `videos/${videoId}/preview.mp4`,
  };
}

/** Initiate a multipart upload and return presigned URLs for each part */
export async function initiateMultipartUpload(
  key: string,
  contentType: string,
  partCount: number
): Promise<{ uploadId: string; presignedUrls: string[] }> {
  const create = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    })
  );

  const uploadId = create.UploadId!;

  const presignedUrls = await Promise.all(
    Array.from({ length: partCount }, (_, i) =>
      getSignedUrl(
        s3,
        new UploadPartCommand({
          Bucket: BUCKET,
          Key: key,
          UploadId: uploadId,
          PartNumber: i + 1,
        }),
        { expiresIn: 3600 }
      )
    )
  );

  return { uploadId, presignedUrls };
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
) {
  return s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
  );
}

export async function abortMultipartUpload(key: string, uploadId: string) {
  return s3.send(
    new AbortMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
    })
  );
}

export async function deleteObject(key: string) {
  return s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function getPresignedPutUrl(key: string, contentType: string, expiresIn = 3600) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn }
  );
}

export async function getPresignedGetUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}
