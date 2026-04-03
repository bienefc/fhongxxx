import type { Metadata } from "next";

export const metadata: Metadata = { title: "18 U.S.C. 2257 Compliance" };

export default function Page2257() {
  const APP = process.env.NEXT_PUBLIC_APP_NAME || "FhongXXX";
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">18 U.S.C. § 2257 Statement</h1>
      <p className="text-gray-400 text-sm mb-8">Records Required Pursuant to 18 U.S.C. 2257</p>

      <div className="prose prose-invert max-w-none space-y-6 text-gray-300 leading-relaxed">
        <p>
          All persons who appear in any visual depiction of sexually explicit conduct on {APP} were
          18 years of age or older at the time of the creation of such depictions.
        </p>
        <p>
          All records required by 18 U.S.C. § 2257 and 28 C.F.R. § 75 are maintained by each content
          producer and/or uploader of content appearing on {APP}. Users who upload content to this
          platform are solely responsible for maintaining the required records in compliance with
          18 U.S.C. § 2257.
        </p>
        <p>
          By uploading content to {APP}, uploaders certify that all performers depicted therein are
          at least 18 years of age and that the uploader maintains proper age verification
          documentation as required by law.
        </p>
        <p>
          For inquiries regarding records, please contact:{" "}
          <a href="mailto:2257@fhongxxx.com" className="text-brand-400 hover:underline">
            2257@fhongxxx.com
          </a>
        </p>
      </div>
    </div>
  );
}
