"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setStatus("idle");
    } else {
      setStatus("done");
    }
  }

  if (status === "done") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-surface-800 rounded-xl p-8 border border-surface-700 text-center">
          <div className="text-4xl mb-4">&#x2709;&#xFE0F;</div>
          <h1 className="text-xl font-semibold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 text-sm mb-6">
            If an account with that email exists, we&apos;ve sent a password reset link.
          </p>
          <Link href="/" className="text-brand-400 hover:underline text-sm">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface-800 rounded-xl p-8 border border-surface-700">
        <h1 className="text-xl font-semibold text-white mb-1">Forgot password</h1>
        <p className="text-gray-400 text-sm mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              placeholder="you@example.com"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {status === "loading" ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/" className="text-brand-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
