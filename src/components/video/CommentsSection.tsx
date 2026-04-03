"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send, ChevronDown } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types";

interface Props {
  videoId: string;
  commentCount: number;
}

export default function CommentsSection({ videoId, commentCount }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [total, setTotal] = useState(commentCount);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  async function loadComments(p = 1) {
    setLoading(true);
    const res = await fetch(`/api/videos/${videoId}/comments?page=${p}`);
    const data = await res.json();
    if (p === 1) setComments(data.items);
    else setComments((prev) => [...prev, ...data.items]);
    setTotal(data.total);
    setHasMore(p < data.totalPages);
    setPage(p);
    setLoading(false);
  }

  useEffect(() => { loadComments(1); }, [videoId]);

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text.trim() }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [comment, ...prev]);
      setTotal((t) => t + 1);
      setText("");
    }
    setPosting(false);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare size={18} className="text-brand-400" />
        Comments <span className="text-gray-400 font-normal text-sm">({total})</span>
      </h3>

      {/* Post comment */}
      {session ? (
        <form onSubmit={postComment} className="flex gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
            {session.user.username[0]}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              className="input flex-1"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              maxLength={2000}
            />
            <button type="submit" disabled={!text.trim() || posting} className="btn-primary px-3">
              <Send size={15} />
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-lg bg-surface-700 border border-surface-600 text-sm text-gray-400 text-center">
          <a href="#" className="text-brand-400 hover:underline" onClick={(e) => { e.preventDefault(); }}>
            Log in
          </a>{" "}
          to leave a comment.
        </div>
      )}

      {/* Comment list */}
      {loading && comments.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-9 h-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} videoId={videoId} />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => loadComments(page + 1)}
          disabled={loading}
          className="btn-ghost w-full mt-4 gap-1.5 text-sm"
        >
          <ChevronDown size={16} />
          Load more comments
        </button>
      )}
    </div>
  );
}

function CommentItem({ comment, videoId }: { comment: CommentWithAuthor; videoId: string }) {
  const { data: session } = useSession();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  async function postReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || posting) return;
    setPosting(true);
    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyText.trim(), parentId: comment.id }),
    });
    if (res.ok) {
      const reply = await res.json();
      setReplies((r) => [...r, reply]);
      setReplyText("");
      setShowReply(false);
    }
    setPosting(false);
  }

  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-surface-500 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
        {comment.author.username[0]}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{comment.author.displayName || comment.author.username}</span>
          <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{comment.body}</p>

        {session && (
          <button
            onClick={() => setShowReply((s) => !s)}
            className="text-xs text-gray-500 hover:text-brand-400 mt-1.5 transition-colors"
          >
            Reply
          </button>
        )}

        {showReply && (
          <form onSubmit={postReply} className="flex gap-2 mt-2">
            <input
              className="input text-sm flex-1"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              autoFocus
            />
            <button type="submit" disabled={!replyText.trim() || posting} className="btn-primary px-2.5">
              <Send size={13} />
            </button>
          </form>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l border-surface-600">
            {replies.map((r) => (
              <div key={r.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-surface-500 flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0">
                  {r.author.username[0]}
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-medium">{r.author.displayName || r.author.username}</span>
                    <span className="text-[10px] text-gray-500">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-300">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
