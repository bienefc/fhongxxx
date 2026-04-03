"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Search, Upload, User, LogOut, Settings, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/auth/AuthModal";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "FhongXXX";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface-800/95 backdrop-blur border-b border-surface-700">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center gap-4 h-14">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-black text-brand-500 tracking-tight">{APP_NAME}</span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden sm:flex">
              <div className="relative w-full">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="input pr-10 bg-surface-900 border-surface-600 h-9 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Nav actions */}
            <div className="flex items-center gap-2 ml-auto">
              {session ? (
                <>
                  <Link href="/upload" className="btn-primary hidden sm:inline-flex gap-1.5 h-8 px-3 text-xs">
                    <Upload size={13} />
                    Upload
                  </Link>

                  {/* User dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen((o) => !o)}
                      className="flex items-center gap-1.5 btn-ghost h-9 px-2 rounded-full"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold uppercase">
                        {session.user.username?.[0]}
                      </div>
                      <ChevronDown size={14} className="hidden sm:block text-gray-400" />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1 w-52 bg-surface-700 border border-surface-600 rounded-lg shadow-xl z-20 overflow-hidden">
                          <div className="px-4 py-3 border-b border-surface-600">
                            <p className="font-semibold text-sm">{session.user.name}</p>
                            <p className="text-xs text-gray-400">@{session.user.username}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              href={`/profile/${session.user.username}`}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-600 transition-colors"
                            >
                              <User size={15} /> My Profile
                            </Link>
                            <Link
                              href="/upload"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-600 transition-colors"
                            >
                              <Upload size={15} /> Upload Video
                            </Link>
                            {session.user.role === "ADMIN" && (
                              <Link
                                href="/admin"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-600 transition-colors text-brand-400"
                              >
                                <Settings size={15} /> Admin Panel
                              </Link>
                            )}
                          </div>
                          <div className="border-t border-surface-600 py-1">
                            <button
                              onClick={() => { setUserMenuOpen(false); signOut(); }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-surface-600 text-red-400 transition-colors"
                            >
                              <LogOut size={15} /> Sign out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => openAuth("login")} className="btn-ghost h-8 px-3 text-sm hidden sm:inline-flex">
                    Log in
                  </button>
                  <button onClick={() => openAuth("register")} className="btn-primary h-8 px-3 text-sm">
                    Sign up
                  </button>
                </>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="btn-ghost p-2 sm:hidden"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          {mobileMenuOpen && (
            <div className="py-3 border-t border-surface-700 sm:hidden">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search videos..."
                    className="input pr-10 h-9 text-sm"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={16} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Category nav */}
        <CategoryNav />
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}

const CATEGORIES = [
  "Amateur", "Asian", "BBW", "BDSM", "Blonde", "Brunette",
  "Compilation", "Ebony", "Fetish", "Hardcore", "Latina",
  "Lesbian", "MILF", "POV", "Solo", "Threesome",
];

function CategoryNav() {
  return (
    <nav className="border-t border-surface-700 bg-surface-900/50">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5">
          <Link href="/videos" className="flex-shrink-0 px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-surface-700 rounded-md transition-colors">
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/categories/${cat.toLowerCase()}`}
              className="flex-shrink-0 px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-surface-700 rounded-md transition-colors whitespace-nowrap"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
