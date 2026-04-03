"use client";
import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, X, Check, AlertCircle, Film, Image as ImageIcon } from "lucide-react";
import { cn, formatBytes, UPLOAD_CHUNK_SIZE, ALLOWED_VIDEO_TYPES } from "@/lib/utils";

interface UploadState {
  stage: "idle" | "selecting" | "uploading" | "processing" | "done" | "error";
  progress: number;
  videoId?: string;
  error?: string;
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  tags: string;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
}

interface Props {
  categories: { id: string; name: string; slug: string }[];
}

export default function VideoUploader({ categories }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>({ stage: "idle", progress: 0 });
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    categoryId: "",
    tags: "",
    visibility: "PUBLIC",
  });
  const abortRef = useRef<(() => void) | null>(null);

  function autoGenerateThumbnail(videoFile: File) {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(video.duration / 2, 10);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) return;
            const thumbFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
            setThumbnail(thumbFile);
            setThumbnailPreview(URL.createObjectURL(blob));
          },
          "image/jpeg",
          0.85
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
      }
    };

    video.onerror = () => URL.revokeObjectURL(objectUrl);
  }

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, "") }));
    setState({ stage: "selecting", progress: 0 });
    autoGenerateThumbnail(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".mpeg"] },
    maxSize: 10 * 1024 * 1024 * 1024,
    maxFiles: 1,
  });

  function handleThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbnail(f);
    const url = URL.createObjectURL(f);
    setThumbnailPreview(url);
  }

  async function handleUpload() {
    if (!file || state.stage === "uploading") return;
    setState({ stage: "uploading", progress: 0 });

    try {
      // 1. Initiate multipart upload
      const partCount = Math.ceil(file.size / UPLOAD_CHUNK_SIZE);
      const initRes = await fetch("/api/upload/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type }),
      });
      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.error || "Failed to initiate upload");
      }
      const { videoId, uploadId, parts, thumbnailUploadUrl } = await initRes.json();

      // 2. Upload thumbnail
      if (thumbnail && thumbnailUploadUrl) {
        await fetch(thumbnailUploadUrl, { method: "PUT", body: thumbnail, headers: { "Content-Type": "image/jpeg" } });
      }

      // 3. Upload parts
      const completedParts: { PartNumber: number; ETag: string }[] = [];
      let aborted = false;
      abortRef.current = () => { aborted = true; };

      for (const { partNumber, presignedUrl } of parts) {
        if (aborted) throw new Error("Upload cancelled");
        const start = (partNumber - 1) * UPLOAD_CHUNK_SIZE;
        const end = Math.min(start + UPLOAD_CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const res = await fetch(presignedUrl, { method: "PUT", body: chunk });
        if (!res.ok) throw new Error(`Part ${partNumber} upload failed`);

        const etag = res.headers.get("ETag") || `"${partNumber}"`;
        completedParts.push({ PartNumber: partNumber, ETag: etag });

        const progress = Math.round((partNumber / partCount) * 85);
        setState({ stage: "uploading", progress, videoId });
      }

      // 4. Complete upload
      setState({ stage: "uploading", progress: 90, videoId });
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          uploadId,
          parts: completedParts,
          title: form.title || file.name.replace(/\.[^/.]+$/, ""),
          description: form.description || undefined,
          categoryId: form.categoryId || undefined,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          visibility: form.visibility,
        }),
      });
      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || "Failed to complete upload");
      }

      setState({ stage: "processing", progress: 100, videoId });

      // 5. Poll for processing completion
      await pollStatus(videoId);
    } catch (err: any) {
      if (err.message !== "Upload cancelled") {
        setState({ stage: "error", progress: 0, error: err.message });
      }
    }
  }

  async function pollStatus(videoId: string) {
    while (true) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/upload/status/${videoId}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === "READY") {
        setState({ stage: "done", progress: 100, videoId });
        setTimeout(() => router.push(`/videos/${videoId}`), 2000);
        return;
      }
      if (data.status === "FAILED") {
        setState({ stage: "error", progress: 0, videoId, error: "Transcoding failed" });
        return;
      }
      if (data.job?.progress) {
        setState((s) => ({ ...s, progress: data.job.progress }));
      }
    }
  }

  if (state.stage === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <Check size={36} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Upload Complete!</h2>
        <p className="text-gray-400">Redirecting to your video...</p>
      </div>
    );
  }

  if (state.stage === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle size={36} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Upload Failed</h2>
        <p className="text-red-400 mb-6">{state.error}</p>
        <button onClick={() => setState({ stage: "idle", progress: 0 })} className="btn-secondary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Drop zone (visible when no file) */}
      {state.stage === "idle" && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-brand-500 bg-brand-500/10"
              : "border-surface-500 hover:border-brand-500/50 hover:bg-surface-700/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center mx-auto mb-6">
            <Upload size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isDragActive ? "Drop it here!" : "Drag & drop your video"}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            MP4, WebM, MOV, AVI, MKV — up to 10 GB
          </p>
          <button type="button" className="btn-primary px-8">
            Browse Files
          </button>
        </div>
      )}

      {/* Upload form (after file selected) */}
      {(state.stage === "selecting" || state.stage === "uploading" || state.stage === "processing") && file && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — metadata form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5">
              <h3 className="font-semibold mb-4 text-gray-200">Video Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Title *</label>
                  <input
                    className="input"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Give your video a title"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Description</label>
                  <textarea
                    className="input resize-none"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe your video..."
                    maxLength={5000}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Category</label>
                    <select
                      className="input"
                      value={form.categoryId}
                      onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    >
                      <option value="">Select a category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Visibility</label>
                    <select
                      className="input"
                      value={form.visibility}
                      onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as any }))}
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="UNLISTED">Unlisted</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Tags (comma-separated)</label>
                  <input
                    className="input"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="amateur, blonde, pov"
                  />
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="card p-5">
              <h3 className="font-semibold mb-4 text-gray-200">Thumbnail</h3>
              <label className="cursor-pointer">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleThumbnail} />
                {thumbnailPreview ? (
                  <div className="relative rounded-lg overflow-hidden aspect-video">
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/50 transition-opacity">
                      <span className="text-sm font-medium">Change thumbnail</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-surface-500 hover:border-brand-500/50 rounded-lg aspect-video flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-200 transition-colors">
                    <ImageIcon size={24} />
                    <span className="text-sm">Upload thumbnail (JPG, PNG)</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Right — file info & upload action */}
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <Film size={18} className="text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
                {state.stage === "selecting" && (
                  <button
                    onClick={() => { setFile(null); setState({ stage: "idle", progress: 0 }); }}
                    className="ml-auto text-gray-400 hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {(state.stage === "uploading" || state.stage === "processing") && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>
                      {state.stage === "uploading" ? "Uploading..." : "Processing..."}
                    </span>
                    <span>{state.progress}%</span>
                  </div>
                  <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                  {state.stage === "processing" && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Converting to HLS... this may take a few minutes.
                    </p>
                  )}
                </div>
              )}

              {state.stage === "selecting" && (
                <button
                  onClick={handleUpload}
                  className="btn-primary w-full"
                  disabled={!form.title.trim()}
                >
                  <Upload size={15} />
                  Start Upload
                </button>
              )}

              {state.stage === "uploading" && (
                <button
                  onClick={() => { abortRef.current?.(); setState({ stage: "idle", progress: 0 }); }}
                  className="btn-danger w-full"
                >
                  Cancel Upload
                </button>
              )}
            </div>

            <div className="card p-4 text-xs text-gray-500 space-y-2">
              <p className="font-medium text-gray-400 text-sm">Upload Guidelines</p>
              <p>• All performers must be 18+ with verifiable records</p>
              <p>• No illegal content or minors</p>
              <p>• DMCA: only upload content you own the rights to</p>
              <p>• Videos are reviewed before going public</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
