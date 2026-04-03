# FhongXXX

A production-grade adult video streaming platform built with Next.js 14, PostgreSQL, FFmpeg, and S3-compatible storage.

---

## Features

- **Video streaming** — Adaptive HLS playback (1080p / 720p / 480p / 360p) via hls.js
- **Video upload** — Multipart S3 upload up to 10 GB with real-time progress
- **Auto transcoding** — FFmpeg worker converts uploads to HLS + generates thumbnail and 15s preview
- **Browse & search** — Sort by newest, trending, most viewed, top rated; filter by category or tag
- **20+ categories** — Pre-seeded (Amateur, Asian, MILF, Lesbian, etc.)
- **Comments** — Threaded replies
- **Likes & views** — Deduped view counting (per IP hash), toggle likes
- **Authentication** — Register / login with email or username
- **User profiles** — Upload history, total views, total likes
- **Admin panel** — Video management with bulk approve / reject / delete
- **Age gate** — Confirmation screen on first visit
- **Legal pages** — TOS, Privacy Policy, DMCA, 18 U.S.C. § 2257, Content Removal
- **Dark UI** — Tailwind CSS, styled like major tube sites
- **Docker Compose** — One command spins up Postgres + Redis + MinIO

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth.js (credentials) |
| Storage | AWS S3 / Cloudflare R2 / MinIO (S3-compatible) |
| Video player | hls.js |
| Job queue | BullMQ + Redis |
| Transcoding | FFmpeg (fluent-ffmpeg) |
| Deployment | Docker / Docker Compose |

---

## Quick Start (Docker)

The fastest way to run everything locally.

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start Postgres, Redis, and MinIO
docker-compose up -d postgres redis minio

# 3. Install dependencies
npm install

# 4. Push database schema and seed categories + admin user
npm run db:push
npm run db:seed

# 5. Run the app
npm run dev

# 6. In a second terminal, run the transcoding worker
npm run worker
```

Open [http://localhost:3000](http://localhost:3000)

**Default admin account:** `admin@fhongxxx.com` / `admin123!`  
**MinIO console:** [http://localhost:9001](http://localhost:9001) — `minioadmin` / `minioadmin123`

> Before the first upload, create the bucket `fhongxxx-videos` in the MinIO console and set its access policy to Public.

---

## Manual Setup (No Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- FFmpeg in `$PATH`
- An S3-compatible storage bucket (AWS S3, Cloudflare R2, Backblaze B2, or self-hosted MinIO)

### 1. Install dependencies

```bash
npm install
cd worker && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in every value. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `AWS_ACCESS_KEY_ID` | S3 / R2 / MinIO access key |
| `AWS_SECRET_ACCESS_KEY` | S3 / R2 / MinIO secret key |
| `AWS_BUCKET_NAME` | Your bucket name |
| `AWS_ENDPOINT_URL` | Only needed for non-AWS providers (R2, MinIO, B2) |
| `CDN_URL` | Optional CDN prefix for serving videos faster |
| `REDIS_URL` | Redis connection string |

### 3. Database

```bash
npm run db:push      # Create all tables from Prisma schema
npm run db:seed      # Insert 20 categories + admin user
```

To open Prisma Studio (visual DB browser):
```bash
npm run db:studio
```

### 4. Run in development

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — FFmpeg transcoding worker
npm run worker
```

### 5. Production build

```bash
npm run build
npm run start
```

---

## Full Docker Compose (all services)

Runs the Next.js app, worker, Postgres, Redis, and MinIO together:

```bash
docker-compose up -d

# Run migrations inside the container
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

---

## Project Structure

```
fhongxxx/
├── prisma/
│   ├── schema.prisma        # Full DB schema
│   └── seed.ts              # Category + admin seeder
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Home feed
│   │   ├── videos/[id]/     # Video player page
│   │   ├── upload/          # Upload page
│   │   ├── search/          # Search results
│   │   ├── categories/      # Category browse
│   │   ├── profile/[user]/  # User profile
│   │   ├── admin/           # Admin panel
│   │   ├── legal/           # TOS, Privacy, DMCA, 2257
│   │   └── api/             # All API routes
│   ├── components/
│   │   ├── layout/          # Header, Footer
│   │   ├── video/           # Player, Card, Grid, Uploader, Comments, LikeButton
│   │   ├── auth/            # Login/Register modal
│   │   ├── admin/           # Admin panel table
│   │   └── ui/              # Toaster
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── auth.ts          # NextAuth config
│   │   ├── s3.ts            # S3 helpers (multipart upload, presigned URLs)
│   │   ├── utils.ts         # formatDuration, formatCount, timeAgo, etc.
│   │   └── video-query.ts   # Reusable video fetch helpers
│   └── types/index.ts       # Shared TypeScript types
└── worker/
    └── transcoder.js        # BullMQ worker — downloads, transcodes, uploads HLS
```

---

## How Video Upload Works

1. Browser calls `POST /api/upload/initiate` with file size and MIME type
2. API creates the video DB record (status: `PENDING`) and returns presigned S3 URLs (one per 10 MB chunk)
3. Browser uploads each chunk directly to S3 using the presigned URLs
4. Browser calls `POST /api/upload/complete` with the finished part ETags
5. API completes the S3 multipart upload, updates the video record (status: `PROCESSING`), and enqueues a BullMQ job
6. The **FFmpeg worker** picks up the job:
   - Downloads the original file from S3 to a temp directory
   - Probes the video (resolution, duration)
   - Transcodes to HLS at all applicable quality levels
   - Uploads HLS segments + master playlist back to S3
   - Generates thumbnail (if none uploaded) and 15s preview clip
   - Updates the DB record to `READY` with `hlsKey`, `thumbnailKey`, `duration`, `width`, `height`
7. Browser polls `GET /api/upload/status/:videoId` until status is `READY`, then redirects to the video page

---

## S3 Bucket Layout

```
videos/
  {videoId}/
    original              ← Raw uploaded file
    thumbnail.jpg         ← Auto-generated or user-uploaded
    preview.mp4           ← 15-second silent preview (shown on hover in grid)
    hls/
      master.m3u8         ← Master HLS playlist (lists all quality levels)
      1080p/
        stream.m3u8
        seg000.ts
        seg001.ts
        ...
      720p/
        stream.m3u8
        seg000.ts
        ...
      480p/ ...
      360p/ ...
```

---

## API Reference

### Videos

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/videos` | — | List public videos. Params: `page`, `pageSize`, `sort`, `category`, `tag`, `q` |
| `GET` | `/api/videos/:id` | — | Get video detail by slug or ID |
| `PATCH` | `/api/videos/:id` | Owner / Admin | Update title, description, tags, category, visibility |
| `DELETE` | `/api/videos/:id` | Owner / Admin | Delete video and S3 objects |
| `POST` | `/api/videos/:id/view` | — | Record a view (deduped per IP per hour) |
| `POST` | `/api/videos/:id/like` | Required | Toggle like/unlike |
| `GET` | `/api/videos/:id/comments` | — | Paginated comment list |
| `POST` | `/api/videos/:id/comments` | Required | Post a comment or reply |

### Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/upload/initiate` | Required | Start multipart upload — returns presigned part URLs |
| `POST` | `/api/upload/complete` | Required | Finish upload, save metadata, queue transcode |
| `GET` | `/api/upload/status/:videoId` | Required | Poll transcode progress |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/[...nextauth]` | NextAuth sign-in / sign-out / session |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/videos` | Admin | List all videos with optional status filter |
| `PATCH` | `/api/admin/videos` | Admin | Bulk action: `approve`, `reject`, or `delete` |

---

## Database Schema (summary)

- **User** — id, username, email, passwordHash, role (USER / CREATOR / ADMIN), premium, verified
- **Video** — id, title, slug, status (PENDING / PROCESSING / READY / FAILED), visibility, hlsKey, thumbnailKey, previewKey, duration, viewCount, likeCount, commentCount, authorId, categoryId
- **Category** — id, name, slug, videoCount
- **Tag / VideoTag** — many-to-many tags on videos
- **Comment** — threaded via parentId
- **Like** — userId + videoId composite key
- **View** — with userId or ipHash for dedup
- **Playlist / PlaylistVideo** — ordered video playlists
- **Subscription** — subscriber → creator
- **TranscodeJob** — tracks FFmpeg job status and progress

---

## Changing the Site Name

Set `NEXT_PUBLIC_APP_NAME` in `.env`:

```env
NEXT_PUBLIC_APP_NAME="YourSiteName"
```

---

## Adding a CDN

Point `CDN_URL` to your CDN origin (Cloudflare, CloudFront, BunnyCDN, etc.) and set your S3 bucket as the origin:

```env
CDN_URL="https://cdn.yourdomain.com"
```

All video, thumbnail, and HLS URLs will automatically use the CDN prefix.

---

## Legal & Compliance Checklist

Before going live, you **must** address all of these:

- [ ] **Age verification for uploaders** — Verify every uploader's age with government ID (Veriff, Stripe Identity, or similar)
- [ ] **18 U.S.C. § 2257 records** — Maintain age verification documentation for all performers depicted in US-accessible content
- [ ] **CSAM detection** — Integrate PhotoDNA or Amazon Rekognition to scan all uploads before they go live
- [ ] **Non-consensual imagery policy** — Establish and enforce a takedown process for revenge porn / non-consensual content
- [ ] **DMCA agent** — Register a DMCA designated agent with the US Copyright Office
- [ ] **GDPR / CCPA** — Implement cookie consent, data subject rights, and a privacy policy compliant with applicable law
- [ ] **Hosting provider** — Confirm your provider permits adult content (OVH, Hetzner, Vultr are generally permissive)
- [ ] **Payment processor** — Use adult-friendly processors: CCBill, Epoch, SegPay (Stripe, PayPal, Square prohibit adult content)
- [ ] **Consult a lawyer** — Adult entertainment law is jurisdiction-specific and complex

---

## Scripts Reference

```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run worker       # Start FFmpeg transcoding worker
npm run db:push      # Sync Prisma schema to DB (dev)
npm run db:migrate   # Run migrations (production)
npm run db:seed      # Seed categories + admin user
npm run db:studio    # Open Prisma Studio (visual DB browser)
```
