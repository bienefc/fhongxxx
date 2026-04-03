/**
 * FhongXXX Video Transcoder Worker
 *
 * Listens to the 'transcode' BullMQ queue and:
 * 1. Downloads original video from S3
 * 2. Transcodes to multi-quality HLS using FFmpeg
 * 3. Uploads HLS segments + playlist back to S3
 * 4. Generates thumbnail (if missing) and preview clip
 * 5. Updates video record in DB to READY
 */
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import { createWriteStream, createReadStream } from "fs";
import { mkdir, rm, readdir, stat } from "fs/promises";
import { join, basename } from "path";
import { pipeline } from "stream/promises";
import { tmpdir } from "os";

// ─── Config ─────────────────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const BUCKET = process.env.AWS_BUCKET_NAME;
const CDN = process.env.CDN_URL;

const redisUrl = new URL(REDIS_URL);
const redisConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
};

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  ...(process.env.AWS_ENDPOINT_URL
    ? { endpoint: process.env.AWS_ENDPOINT_URL, forcePathStyle: true }
    : {}),
});

const prisma = new PrismaClient();

// ─── HLS quality renditions ──────────────────────────────────────────────────
const RENDITIONS = [
  { name: "1080p", width: 1920, height: 1080, videoBr: "4000k", audioBr: "192k" },
  { name: "720p",  width: 1280, height: 720,  videoBr: "2500k", audioBr: "128k" },
  { name: "480p",  width: 854,  height: 480,  videoBr: "1000k", audioBr: "96k"  },
  { name: "360p",  width: 640,  height: 360,  videoBr: "600k",  audioBr: "64k"  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function downloadFromS3(key, destPath) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  await pipeline(res.Body, createWriteStream(destPath));
}

async function uploadToS3(localPath, s3Key, contentType) {
  const stream = createReadStream(localPath);
  const s3ContentType =
    contentType ||
    (s3Key.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t");

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: stream,
      ContentType: s3ContentType,
      CacheControl: "public, max-age=31536000",
    })
  );
}

async function uploadDirToS3(localDir, s3Prefix) {
  const entries = await readdir(localDir);
  await Promise.all(
    entries.map(async (name) => {
      const localPath = join(localDir, name);
      const s3Key = `${s3Prefix}${name}`;
      const s = await stat(localPath);
      if (s.isFile()) {
        const ct = name.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t";
        await uploadToS3(localPath, s3Key, ct);
      }
    })
  );
}

function probeVideo(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata);
    });
  });
}

async function generateHLS(inputPath, outputDir, renditions, onProgress) {
  // Filter renditions by source resolution
  const probe = await probeVideo(inputPath);
  const srcStream = probe.streams.find((s) => s.codec_type === "video");
  const srcHeight = srcStream?.height || 1080;

  const applicable = renditions.filter((r) => r.height <= srcHeight);
  if (applicable.length === 0) applicable.push(renditions[renditions.length - 1]);

  const duration = probe.format.duration || 0;

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath)
      .outputOptions(["-hide_banner", "-y"])
      .on("progress", (p) => {
        const pct = duration > 0 ? Math.min(95, Math.round((p.timemark?.split(":").reduce((acc, t, i) => acc + Number(t) * [3600, 60, 1][i], 0) / duration) * 80)) : p.percent || 0;
        onProgress(pct);
      })
      .on("end", resolve)
      .on("error", reject);

    // Build output for each rendition as separate stream
    applicable.forEach((r, i) => {
      const streamDir = join(outputDir, r.name);
      cmd = cmd
        .output(join(streamDir, "stream.m3u8").replace(/\\/g, "/"))
        .outputOptions([
          `-vf`, `scale=w=${r.width}:h=${r.height}:force_original_aspect_ratio=decrease,pad=${r.width}:${r.height}:(ow-iw)/2:(oh-ih)/2`,
          `-c:v`, `libx264`,
          `-preset`, `fast`,
          `-crf`, `23`,
          `-b:v`, r.videoBr,
          `-maxrate`, r.videoBr,
          `-bufsize`, `${parseInt(r.videoBr) * 2}k`,
          `-c:a`, `aac`,
          `-b:a`, r.audioBr,
          `-f`, `hls`,
          `-hls_time`, `6`,
          `-hls_playlist_type`, `vod`,
          `-hls_segment_filename`, join(streamDir, "seg%03d.ts").replace(/\\/g, "/"),
        ]);
    });

    cmd.run();
  });
}

async function generateMasterPlaylist(renditions, s3HlsDir) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const r of renditions) {
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(r.videoBr) * 1000},RESOLUTION=${r.width}x${r.height},NAME="${r.name}"`);
    lines.push(`${r.name}/stream.m3u8`);
  }
  return lines.join("\n");
}

async function generateThumbnail(inputPath, outputPath, time = "00:00:03") {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(time)
      .frames(1)
      .output(outputPath)
      .outputOptions([`-vf`, `scale=1280:-1`, `-q:v`, `3`])
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

async function generatePreview(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput("00:00:10")
      .duration(15)
      .output(outputPath)
      .outputOptions([
        `-vf`, `scale=640:-1`,
        `-c:v`, `libx264`,
        `-preset`, `ultrafast`,
        `-crf`, `28`,
        `-an`,
        `-movflags`, `faststart`,
      ])
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

function getPublicUrl(key) {
  if (CDN) return `${CDN}/${key}`;
  const endpoint = process.env.AWS_ENDPOINT_URL;
  if (endpoint) return `${endpoint}/${BUCKET}/${key}`;
  return `https://${BUCKET}.s3.amazonaws.com/${key}`;
}

// ─── Main worker ─────────────────────────────────────────────────────────────
async function processVideo(job) {
  const { videoId } = job.data;
  const workDir = join(tmpdir(), `transcode-${videoId}`);

  console.log(`[transcode] Starting job for video ${videoId}`);

  const updateProgress = async (progress, status = "processing") => {
    const safeProgress = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
    const data = { progress: safeProgress, status };
    if (safeProgress === 0) data.startedAt = new Date();
    await prisma.transcodeJob.updateMany({ where: { videoId }, data });
    await job.updateProgress(safeProgress);
  };

  try {
    await mkdir(workDir, { recursive: true });
    await updateProgress(0, "processing");

    // 1. Fetch video record
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new Error("Video not found in DB");
    if (!video.originalKey) throw new Error("No original key");

    // 2. Download original
    console.log(`[transcode] Downloading from S3: ${video.originalKey}`);
    const inputPath = join(workDir, "original.mp4");
    await downloadFromS3(video.originalKey, inputPath);
    await updateProgress(5);

    // 3. Probe video
    const probe = await probeVideo(inputPath);
    const vStream = probe.streams.find((s) => s.codec_type === "video");
    const aStream = probe.streams.find((s) => s.codec_type === "audio");
    const duration = Math.round(Number(probe.format.duration) || 0);
    const width = vStream?.width || null;
    const height = vStream?.height || null;

    // 4. Transcode to HLS
    const hlsDir = join(workDir, "hls");
    await mkdir(hlsDir, { recursive: true });
    for (const r of RENDITIONS) {
      await mkdir(join(hlsDir, r.name), { recursive: true });
    }

    console.log(`[transcode] Transcoding to HLS...`);
    const applicable = RENDITIONS.filter((r) => r.height <= (height || 1080));
    if (applicable.length === 0) applicable.push(RENDITIONS[RENDITIONS.length - 1]);

    await generateHLS(inputPath, hlsDir, applicable, (pct) => updateProgress(5 + pct));
    await updateProgress(85);

    // 5. Generate & upload master playlist
    const masterContent = await generateMasterPlaylist(applicable, `videos/${videoId}/hls/`);
    const masterPath = join(hlsDir, "master.m3u8");
    await (await import("fs/promises")).writeFile(masterPath, masterContent);

    // 6. Upload HLS to S3
    console.log(`[transcode] Uploading HLS to S3...`);
    const hlsS3Prefix = `videos/${videoId}/hls/`;
    await uploadToS3(masterPath, `${hlsS3Prefix}master.m3u8`, "application/vnd.apple.mpegurl");
    for (const r of applicable) {
      await uploadDirToS3(join(hlsDir, r.name), `${hlsS3Prefix}${r.name}/`);
    }
    await updateProgress(92);

    // 7. Thumbnail (if not uploaded by user)
    const thumbnailPath = join(workDir, "thumb.jpg");
    let thumbnailKey = video.thumbnailKey;
    if (!thumbnailKey) {
      try {
        await generateThumbnail(inputPath, thumbnailPath);
        thumbnailKey = `videos/${videoId}/thumbnail.jpg`;
        await uploadToS3(thumbnailPath, thumbnailKey, "image/jpeg");
      } catch {
        console.warn(`[transcode] Thumbnail generation failed (non-fatal)`);
      }
    }

    // 8. Preview clip
    const previewPath = join(workDir, "preview.mp4");
    const previewKey = `videos/${videoId}/preview.mp4`;
    try {
      await generatePreview(inputPath, previewPath);
      await uploadToS3(previewPath, previewKey, "video/mp4");
    } catch {
      console.warn(`[transcode] Preview generation failed (non-fatal)`);
    }
    await updateProgress(98);

    // 9. Update DB
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "READY",
        visibility: "PUBLIC",
        publishedAt: new Date(),
        hlsKey: `${hlsS3Prefix}master.m3u8`,
        thumbnailKey,
        previewKey,
        duration,
        width,
        height,
      },
    });

    await prisma.transcodeJob.updateMany({
      where: { videoId },
      data: { status: "done", progress: 100, doneAt: new Date() },
    });

    // Update category videoCount
    if (video.categoryId) {
      await prisma.category.update({
        where: { id: video.categoryId },
        data: { videoCount: { increment: 1 } },
      });
    }

    console.log(`[transcode] Video ${videoId} done. Duration: ${duration}s`);
  } catch (err) {
    console.error(`[transcode] Error for ${videoId}:`, err);
    await prisma.video.update({ where: { id: videoId }, data: { status: "FAILED" } });
    await prisma.transcodeJob.updateMany({
      where: { videoId },
      data: { status: "failed", error: err.message, doneAt: new Date() },
    });
    throw err;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

// ─── Start worker ─────────────────────────────────────────────────────────────
const worker = new Worker("transcode", processVideo, {
  connection: redisConnection,
  concurrency: Number(process.env.WORKER_CONCURRENCY || 2),
});

worker.on("active", (job) => console.log(`[worker] Active: ${job.id}`));
worker.on("completed", (job) => console.log(`[worker] Completed: ${job.id}`));
worker.on("failed", (job, err) => console.error(`[worker] Failed: ${job?.id}`, err.message));

console.log("[worker] Transcoder started. Waiting for jobs...");

process.on("SIGTERM", async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
