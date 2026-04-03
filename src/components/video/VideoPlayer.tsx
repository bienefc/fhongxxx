"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, ChevronRight, SkipForward, SkipBack,
} from "lucide-react";
import { formatDuration, cn } from "@/lib/utils";

interface Props {
  hlsUrl: string;
  thumbnailUrl?: string | null;
  videoId: string;
  title?: string;
  autoPlay?: boolean;
}

export default function VideoPlayer({ hlsUrl, thumbnailUrl, videoId, title, autoPlay }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout>();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState("auto");

  // Register view
  useEffect(() => {
    fetch(`/api/videos/${videoId}/view`, { method: "POST" }).catch(() => {});
  }, [videoId]);

  // HLS setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: any;

    async function setup() {
      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS (Safari)
        video!.src = hlsUrl;
      } else {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(hlsUrl);
          hls.attachMedia(video!);
        } else {
          video!.src = hlsUrl;
        }
      }

      if (autoPlay) video!.play().catch(() => {});
    }

    setup();
    return () => hls?.destroy();
  }, [hlsUrl, autoPlay]);

  // Video events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onDuration = () => setDuration(v.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDuration);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("loadeddata", onCanPlay);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDuration);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("loadeddata", onCanPlay);
    };
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    if (playing) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
    v.muted = val === 0;
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const v = videoRef.current;
    if (v && duration) v.currentTime = pct * duration;
  }

  function skip(secs: number) {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(duration, v.currentTime + secs));
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!fullscreen) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black group select-none"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={thumbnailUrl || undefined}
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Center play/pause on click area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!playing && !loading && (
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
              <Play size={28} fill="white" className="text-white ml-1" />
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="px-3 pb-3 space-y-2">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-1 hover:h-2 bg-white/20 rounded-full cursor-pointer transition-all group/progress"
            onClick={handleProgressClick}
          >
            {/* Buffered */}
            <div
              className="absolute left-0 top-0 h-full bg-white/30 rounded-full"
              style={{ width: `${bufferedPct}%` }}
            />
            {/* Progress */}
            <div
              className="absolute left-0 top-0 h-full bg-brand-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
            {/* Scrubber dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-brand-400 transition-colors p-1">
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {/* Skip */}
            <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors p-1">
              <SkipBack size={17} />
            </button>
            <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors p-1">
              <SkipForward size={17} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-brand-400 transition-colors p-1">
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 accent-brand-500 opacity-0 group-hover/vol:opacity-100 transition-opacity cursor-pointer"
              />
            </div>

            {/* Time */}
            <span className="text-white/80 text-xs font-mono ml-1">
              {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
            </span>

            <div className="flex-1" />

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings((s) => !s)}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <Settings size={17} />
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-surface-800 border border-surface-600 rounded-lg p-3 w-44 text-sm">
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Quality</p>
                  {["auto", "1080p", "720p", "480p", "360p"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setQuality(q); setShowSettings(false); }}
                      className={cn(
                        "flex items-center justify-between w-full px-2 py-1.5 rounded hover:bg-surface-600 transition-colors",
                        quality === q && "text-brand-400"
                      )}
                    >
                      {q.toUpperCase()}
                      {quality === q && <ChevronRight size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors p-1">
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
