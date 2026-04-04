"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Verification link is missing a token.",
  invalid: "Verification link is invalid.",
  expired: "Verification link has expired. Please register again.",
};

function VerifyEmailContent() {
  const params = useSearchParams();
  const error = params.get("error");

  if (error) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
        <h1 className="text-xl font-semibold text-white mb-2">Verification failed</h1>
        <p className="text-gray-400 mb-6">{ERROR_MESSAGES[error] ?? "Something went wrong."}</p>
        <Link href="/" className="text-brand-400 hover:underline text-sm">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-4xl mb-4">&#x2709;&#xFE0F;</div>
      <h1 className="text-xl font-semibold text-white mb-2">Check your email</h1>
      <p className="text-gray-400 mb-2">
        We sent a verification link to your email address.
      </p>
      <p className="text-gray-500 text-sm mb-6">
        Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
      </p>
      <Link href="/" className="text-brand-400 hover:underline text-sm">
        Back to home
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface-800 rounded-xl p-8 border border-surface-700">
        <Suspense>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
