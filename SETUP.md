# FhongXXX — Setup Guide

## Quick Start (Docker — Easiest)

```bash
# 1. Clone / enter project
cd fhongxxx

# 2. Copy env
cp .env.example .env
# Edit .env with your values (or leave defaults for local Docker)

# 3. Start all services
docker-compose up -d

# 4. Run migrations
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed

# 5. Visit http://localhost:3000
```

Admin login: `admin@fhongxxx.com` / `admin123!`  
MinIO console: `http://localhost:9001` (minioadmin / minioadmin123)

---

## Manual Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- FFmpeg (in $PATH)
- S3-compatible storage (AWS S3, Cloudflare R2, MinIO, Backblaze B2)

### 1. Install dependencies
```bash
npm install
cd worker && npm install && cd ..
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Database setup
```bash
npm run db:push      # Create schema
npm run db:seed      # Seed categories + admin user
```

### 4. Start the app (development)
```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Transcoding worker
npm run worker
```

### 5. Production build
```bash
npm run build
npm run start
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser                                            │
│  ├── Next.js 14 (App Router, SSR + Client)         │
│  ├── HLS.js video player                           │
│  └── Tailwind CSS dark UI                          │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│  Next.js API Routes                                 │
│  ├── /api/auth — NextAuth (credentials)            │
│  ├── /api/videos — CRUD, views, likes, comments    │
│  ├── /api/upload — Multipart S3 upload             │
│  └── /api/admin — Admin panel                      │
└──────┬────────────────────────────────┬─────────────┘
       │                                │
┌──────▼──────┐                ┌────────▼────────────┐
│ PostgreSQL  │                │   Redis + BullMQ    │
│ (Prisma ORM)│                │   (job queue)       │
└─────────────┘                └────────┬────────────┘
                                        │
                               ┌────────▼────────────┐
                               │  FFmpeg Worker      │
                               │  - Download original│
                               │  - Multi-quality HLS│
                               │  - Thumbnail        │
                               │  - Preview clip     │
                               │  - Upload to S3     │
                               └────────┬────────────┘
                                        │
                               ┌────────▼────────────┐
                               │  S3 / CDN           │
                               │  (videos, HLS, thumbs│
                               └─────────────────────┘
```

## Key Pages
| URL | Description |
|-----|-------------|
| `/` | Home — sortable video feed |
| `/videos/[slug]` | Video player page |
| `/upload` | Upload (auth required) |
| `/search?q=...` | Search results |
| `/categories` | All categories |
| `/categories/[slug]` | Category page |
| `/profile/[username]` | User profile |
| `/admin` | Admin panel (admin role) |

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos` | List videos (paginated, sortable) |
| GET | `/api/videos/:id` | Get video by slug |
| PATCH | `/api/videos/:id` | Update video metadata |
| DELETE | `/api/videos/:id` | Delete video |
| POST | `/api/videos/:id/view` | Record view |
| POST | `/api/videos/:id/like` | Toggle like |
| GET/POST | `/api/videos/:id/comments` | Comments |
| POST | `/api/upload/initiate` | Start multipart upload |
| POST | `/api/upload/complete` | Complete upload + queue transcode |
| GET | `/api/upload/status/:id` | Poll transcode status |
| GET | `/api/categories` | All categories |
| GET/PATCH | `/api/admin/videos` | Admin video management |

## S3 Bucket Structure
```
videos/
  {videoId}/
    original          ← Raw upload
    hls/
      master.m3u8     ← HLS master playlist
      1080p/
        stream.m3u8
        seg000.ts, seg001.ts, ...
      720p/...
      480p/...
      360p/...
    thumbnail.jpg
    preview.mp4       ← 15-second preview
```

## Legal Compliance
- Age gate on every page visit
- 18 U.S.C. § 2257 statement page
- DMCA takedown process
- Content removal contact
- Terms of Service
- Privacy Policy

> **Important**: You are responsible for obtaining age verification for all content uploaders,
> maintaining 2257 records, and complying with laws in all jurisdictions you operate in.
> Consult a lawyer specializing in adult entertainment law before launching.
