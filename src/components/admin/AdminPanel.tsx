"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2, RefreshCw, Eye, ExternalLink, Download } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import Link from "next/link";

type VideoRow = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  viewCount: number;
  createdAt: string;
  author: { username: string };
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  PROCESSING: "text-blue-400 bg-blue-400/10",
  READY: "text-green-400 bg-green-400/10",
  FAILED: "text-red-400 bg-red-400/10",
};

export default function AdminPanel({ initialVideos }: { initialVideos: VideoRow[] }) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialVideos.length);

  // Eporner import state
  const [importQuery, setImportQuery] = useState("");
  const [importCount, setImportCount] = useState(20);
  const [importOrder, setImportOrder] = useState("most-popular");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
      if (data.imported > 0) await loadVideos(statusFilter, page);
    } catch {
      setSyncResult({ imported: 0, skipped: 0 });
    } finally {
      setSyncing(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: importQuery, count: importCount, order: importOrder }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.imported > 0) await loadVideos(statusFilter, page);
    } catch (e) {
      setImportResult({ imported: 0, skipped: 0 });
    } finally {
      setImporting(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === videos.length) setSelected(new Set());
    else setSelected(new Set(videos.map((v) => v.id)));
  }

  async function bulkAction(action: "approve" | "reject" | "delete") {
    if (selected.size === 0) return;
    const confirmed = action === "delete" ? confirm(`Delete ${selected.size} video(s)?`) : true;
    if (!confirmed) return;

    setLoading(true);
    const res = await fetch("/api/admin/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action }),
    });

    if (res.ok) {
      setSelected(new Set());
      await loadVideos(statusFilter, page);
    }
    setLoading(false);
  }

  async function loadVideos(status: string, p: number) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (status !== "all") params.set("status", status);
    const res = await fetch(`/api/admin/videos?${params}`);
    const data = await res.json();
    setVideos(data.items);
    setTotal(data.total);
    setLoading(false);
  }

  async function handleFilterChange(status: string) {
    setStatusFilter(status);
    setPage(1);
    await loadVideos(status, 1);
  }

  const statuses = ["all", "PENDING", "PROCESSING", "READY", "FAILED"];

  return (
    <div className="space-y-6">
      {/* Eporner Import */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Download size={15} /> Import from Eporner
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={importQuery}
            onChange={(e) => setImportQuery(e.target.value)}
            placeholder="Search query (leave blank for trending)"
            className="input text-sm flex-1 min-w-[200px]"
          />
          <select
            value={importOrder}
            onChange={(e) => setImportOrder(e.target.value)}
            className="input text-sm w-40"
          >
            <option value="most-popular">Most Popular</option>
            <option value="top-rated">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="longest">Longest</option>
          </select>
          <input
            type="number"
            value={importCount}
            onChange={(e) => setImportCount(Number(e.target.value))}
            min={1}
            max={100}
            className="input text-sm w-20"
          />
          <button
            onClick={handleImport}
            disabled={importing}
            className="btn-primary text-sm px-4 h-9"
          >
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
        {importResult && (
          <p className="text-xs mt-2 text-gray-400">
            Done — <span className="text-green-400">{importResult.imported} imported</span>,{" "}
            <span className="text-yellow-400">{importResult.skipped} skipped</span> (already exist)
          </p>
        )}

        <div className="border-t border-surface-700 mt-4 pt-4 flex items-center gap-3">
          <div>
            <p className="text-xs font-medium text-gray-300">Auto-sync</p>
            <p className="text-xs text-gray-500">Fetches newest videos from Eporner (runs automatically every 6h on Vercel)</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary text-sm px-4 h-9 ml-auto flex-shrink-0"
          >
            {syncing ? "Syncing…" : "Run Sync Now"}
          </button>
          {syncResult && (
            <p className="text-xs text-gray-400">
              <span className="text-green-400">{syncResult.imported} new</span>,{" "}
              <span className="text-yellow-400">{syncResult.skipped} skipped</span>
            </p>
          )}
        </div>
      </div>

    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-surface-700">
        <div className="flex gap-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                statusFilter === s ? "bg-brand-500 text-white" : "bg-surface-600 text-gray-400 hover:text-gray-200"
              )}
            >
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-xs text-gray-400 self-center">{selected.size} selected</span>
              <button onClick={() => bulkAction("approve")} className="btn-secondary gap-1.5 text-xs h-8 px-3 text-green-400">
                <CheckCircle size={13} /> Approve
              </button>
              <button onClick={() => bulkAction("reject")} className="btn-secondary gap-1.5 text-xs h-8 px-3 text-yellow-400">
                <XCircle size={13} /> Reject
              </button>
              <button onClick={() => bulkAction("delete")} className="btn-secondary gap-1.5 text-xs h-8 px-3 text-red-400">
                <Trash2 size={13} /> Delete
              </button>
            </>
          )}
          <button
            onClick={() => loadVideos(statusFilter, page)}
            disabled={loading}
            className="btn-ghost p-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-700 text-xs text-gray-400 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selected.size === videos.length && videos.length > 0}
                  onChange={selectAll}
                  className="rounded accent-brand-500"
                />
              </th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Author</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Visibility</th>
              <th className="px-4 py-3 text-right">Views</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {videos.map((v) => (
              <tr key={v.id} className={cn("hover:bg-surface-700/50 transition-colors", selected.has(v.id) && "bg-brand-500/5")}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(v.id)}
                    onChange={() => toggleSelect(v.id)}
                    className="rounded accent-brand-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-200 truncate max-w-[300px]">{v.title}</p>
                  <p className="text-xs text-gray-500 font-mono">{v.id.slice(0, 8)}...</p>
                </td>
                <td className="px-4 py-3 text-gray-400">{v.author.username}</td>
                <td className="px-4 py-3">
                  <span className={cn("badge text-xs", STATUS_COLORS[v.status] || "text-gray-400")}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{v.visibility}</td>
                <td className="px-4 py-3 text-right text-gray-400">{v.viewCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{timeAgo(v.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      href={`/videos/${v.id}`}
                      target="_blank"
                      className="btn-ghost p-1.5 text-gray-400 hover:text-brand-400"
                    >
                      <ExternalLink size={13} />
                    </Link>
                    <button
                      onClick={() => {
                        setSelected(new Set([v.id]));
                        bulkAction("delete");
                      }}
                      className="btn-ghost p-1.5 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {videos.length === 0 && (
          <div className="text-center py-12 text-gray-500">No videos found.</div>
        )}
      </div>

      {/* Footer pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-surface-700 text-xs text-gray-500">
        <span>{total.toLocaleString()} total</span>
        <div className="flex gap-2">
          <button
            onClick={() => { const p = Math.max(1, page - 1); setPage(p); loadVideos(statusFilter, p); }}
            disabled={page === 1 || loading}
            className="btn-ghost px-3 py-1 text-xs disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="flex items-center">Page {page}</span>
          <button
            onClick={() => { const p = page + 1; setPage(p); loadVideos(statusFilter, p); }}
            disabled={loading}
            className="btn-ghost px-3 py-1 text-xs"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
