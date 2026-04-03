import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

const APP = process.env.NEXT_PUBLIC_APP_NAME || "FhongXXX";

export default function TosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: {new Date().getFullYear()}</p>

      <div className="space-y-8 text-gray-300 leading-relaxed text-sm">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Age Requirement</h2>
          <p>
            You must be at least 18 years of age to access or use {APP}. By using this site,
            you confirm that you are 18 years of age or older and that you have the legal right
            to access adult content in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Content Standards</h2>
          <p className="mb-2">Users may not upload content that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Depicts minors in any sexual context (zero tolerance — immediate removal and law enforcement reporting)</li>
            <li>Was created without the informed consent of all participants</li>
            <li>Constitutes non-consensual imagery or "revenge porn"</li>
            <li>Violates any applicable law</li>
            <li>Infringes third-party intellectual property rights</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Uploader Responsibilities</h2>
          <p>
            By uploading content, you certify that all persons depicted are 18 years of age or older
            and that you maintain age verification records as required by 18 U.S.C. § 2257.
            You also certify that you have the legal right to distribute the content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Content Removal</h2>
          <p>
            We reserve the right to remove any content at our sole discretion. To request removal
            of content, contact{" "}
            <a href="mailto:removal@fhongxxx.com" className="text-brand-400 hover:underline">
              removal@fhongxxx.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Disclaimer</h2>
          <p>
            {APP} is provided "as is" without warranties of any kind. We are not responsible
            for user-generated content. We are a platform, not a producer of any content.
          </p>
        </section>
      </div>
    </div>
  );
}
