import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

const APP = process.env.NEXT_PUBLIC_APP_NAME || "FhongXXX";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: {new Date().getFullYear()}</p>

      <div className="space-y-8 text-gray-300 leading-relaxed text-sm">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Account information: email, username (required to create an account)</li>
            <li>Usage data: pages viewed, videos watched, search queries</li>
            <li>Technical data: IP address (hashed), browser type, device info</li>
            <li>Uploaded content metadata</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and improve our services</li>
            <li>To personalize your experience</li>
            <li>To communicate service updates (with consent)</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Data Retention</h2>
          <p>We retain account data while your account is active. You may request deletion of your account and associated data by contacting us.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Cookies</h2>
          <p>We use essential cookies for authentication and age gate confirmation. We do not use third-party tracking cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data. Contact us at{" "}
            <a href={`mailto:privacy@fhongxxx.com`} className="text-brand-400 hover:underline">privacy@fhongxxx.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
