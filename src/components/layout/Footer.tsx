import Link from "next/link";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "FhongXXX";

export default function Footer() {
  return (
    <footer className="border-t border-surface-700 bg-surface-800 mt-16">
      <div className="max-w-[1600px] mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h3 className="text-brand-500 font-black text-xl mb-3">{APP_NAME}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Free adult videos for consenting adults 18+. All models are 18 years of age or older.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-300 mb-3">Browse</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/videos?sort=newest" className="hover:text-gray-200 transition-colors">New Videos</Link></li>
              <li><Link href="/videos?sort=popular" className="hover:text-gray-200 transition-colors">Popular</Link></li>
              <li><Link href="/videos?sort=trending" className="hover:text-gray-200 transition-colors">Trending</Link></li>
              <li><Link href="/categories" className="hover:text-gray-200 transition-colors">Categories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-300 mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/upload" className="hover:text-gray-200 transition-colors">Upload Video</Link></li>
              <li><Link href="/profile" className="hover:text-gray-200 transition-colors">My Profile</Link></li>
              <li><Link href="/playlists" className="hover:text-gray-200 transition-colors">Playlists</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-300 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/legal/tos" className="hover:text-gray-200 transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-gray-200 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/dmca" className="hover:text-gray-200 transition-colors">DMCA</Link></li>
              <li><Link href="/legal/2257" className="hover:text-gray-200 transition-colors">18 U.S.C. 2257</Link></li>
              <li><Link href="/legal/content-removal" className="hover:text-gray-200 transition-colors">Content Removal</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 text-center">
            All models appearing on this website are 18 years or older.{" "}
            <Link href="/legal/2257" className="underline hover:text-gray-400">18 U.S.C. 2257</Link> Record-Keeping Requirements.
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="border border-gray-700 rounded px-2 py-0.5">ADULTS ONLY</span>
            <span className="border border-gray-700 rounded px-2 py-0.5">18+</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
