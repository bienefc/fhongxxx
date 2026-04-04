"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({ open, onClose, initialMode = "login" }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ login: "", username: "", email: "", password: "" });

  if (!open) return null;

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      login: form.login,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error === "EMAIL_NOT_VERIFIED") {
        setError("Please verify your email before signing in. Check your inbox.");
      } else {
        setError("Invalid email/username or password");
      }
    } else {
      onClose();
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      onClose();
      router.push("/verify-email");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
          <h2 className="text-lg font-bold">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-700">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                mode === m
                  ? "text-brand-400 border-b-2 border-brand-400 -mb-px"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Email or Username</label>
                <input
                  className="input"
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={form.login}
                  onChange={(e) => set("login", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                {loading ? "Signing in..." : "Log In"}
              </button>
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  onClick={onClose}
                  className="text-xs text-gray-500 hover:text-brand-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Username</label>
                <input
                  className="input"
                  type="text"
                  autoComplete="username"
                  placeholder="cooluser123"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Email</label>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPass ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                By signing up you confirm you are 18+ and agree to our Terms of Service.
              </p>
              <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
