"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatCount, cn } from "@/lib/utils";

interface Props {
  videoId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({ videoId, initialLiked, initialCount }: Props) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!session) {
      // Could trigger auth modal here via event
      alert("Please log in to like videos.");
      return;
    }
    if (loading) return;
    setLoading(true);

    const prev = liked;
    setLiked(!liked);
    setCount((c) => c + (liked ? -1 : 1));

    const res = await fetch(`/api/videos/${videoId}/like`, { method: "POST" });
    if (!res.ok) {
      setLiked(prev);
      setCount((c) => c + (liked ? 1 : -1));
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        liked
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
          : "bg-surface-600 text-gray-300 hover:bg-surface-500 border border-surface-500"
      )}
    >
      <Heart
        size={16}
        className={cn("transition-transform", liked && "scale-110")}
        fill={liked ? "currentColor" : "none"}
      />
      <span>{formatCount(count)}</span>
    </button>
  );
}
