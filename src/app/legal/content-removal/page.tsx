import type { Metadata } from "next";

export const metadata: Metadata = { title: "Content Removal" };

export default function ContentRemovalPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Content Removal</h1>
      <p className="text-gray-400 text-sm mb-8">
        We are committed to removing content upon valid request.
      </p>

      <div className="space-y-6 text-gray-300 leading-relaxed">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Remove Your Content</h2>
          <p className="text-sm mb-4">
            If you appear in content on this site and did not consent to its upload, or you
            are the rightful owner and wish it removed, contact us immediately:
          </p>
          <a
            href="mailto:removal@fhongxxx.com"
            className="btn-primary inline-flex"
          >
            removal@fhongxxx.com
          </a>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-3">What to Include</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>Direct link(s) to the content</li>
            <li>Description of why you want it removed</li>
            <li>Your relationship to the content (you appear in it, you are the copyright holder, etc.)</li>
            <li>Your contact information</li>
          </ul>
        </div>

        <p className="text-sm text-gray-500">
          We process removal requests within 24–48 hours. Non-consensual content and content
          depicting minors is removed immediately upon discovery or report.
        </p>
      </div>
    </div>
  );
}
