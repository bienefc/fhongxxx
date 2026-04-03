import type { Metadata } from "next";

export const metadata: Metadata = { title: "DMCA Policy" };

export default function DmcaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">DMCA Copyright Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Digital Millennium Copyright Act Notice & Takedown Procedure</p>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Overview</h2>
          <p>
            We respect intellectual property rights and expect our users to do the same.
            We respond to properly submitted DMCA takedown requests as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Submit a DMCA Notice</h2>
          <p className="mb-4">To submit a valid DMCA takedown notice, provide the following in writing:</p>
          <ol className="list-decimal pl-6 space-y-2 text-sm">
            <li>Your physical or electronic signature</li>
            <li>Identification of the copyrighted work you claim has been infringed</li>
            <li>Identification of the material on our site that you believe infringes your copyright, with enough detail for us to locate it</li>
            <li>Your contact information (address, phone, email)</li>
            <li>A statement that you have a good faith belief the use is unauthorized</li>
            <li>A statement, under penalty of perjury, that the information is accurate and you are the copyright owner or authorized to act on their behalf</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Submit To</h2>
          <p>
            Email:{" "}
            <a href="mailto:dmca@fhongxxx.com" className="text-brand-400 hover:underline">
              dmca@fhongxxx.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Counter-Notice</h2>
          <p>
            If you believe your content was removed in error, you may submit a counter-notice
            containing the required statutory information. Upon receipt of a valid counter-notice,
            we will restore the content unless the complaining party files a court action.
          </p>
        </section>
      </div>
    </div>
  );
}
