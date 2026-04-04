"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 mb-4">Invalid reset link.</p>
        <Link href="/forgot-password" className="text-brand-400 hover:underline text-sm">
          Request a new one
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("loading");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setStatus("idle");
    } else {
      setStatus("done");
      setTimeout(() => router.push("/"), 2000);
    }
  }

  if (status === "done") {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">&#x2705;</div>
        <h1 className="text-xl font-semibold text-white mb-2">Password updated</h1>
        <p className="text-gray-400 text-sm">Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-white mb-1">Reset password</h1>
      <p className="text-gray-400 text-sm mb-6">Enter your new password below.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">New password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:border-brand-500"
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:border-brand-500"
              placeholder="Repeat password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          {status === "loading" ? "Updating..." : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface-800 rounded-xl p-8 border border-surface-700">
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
