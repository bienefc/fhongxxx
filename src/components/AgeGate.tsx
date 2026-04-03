"use client";
import { useState, useEffect } from "react";

export default function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const confirmed = localStorage.getItem("age-confirmed");
    if (!confirmed) setShow(true);
  }, []);

  function confirm() {
    localStorage.setItem("age-confirmed", "1");
    setShow(false);
  }

  function deny() {
    window.location.href = "https://www.google.com";
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-surface-800 border border-surface-600 rounded-2xl p-8 text-center shadow-2xl">
        {/* Logo */}
        <div className="text-4xl font-black text-brand-500 mb-2">
          {process.env.NEXT_PUBLIC_APP_NAME || "FhongXXX"}
        </div>

        <div className="w-16 h-1 bg-brand-500 rounded-full mx-auto mb-6" />

        <h1 className="text-2xl font-bold text-white mb-3">Age Verification</h1>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          This website contains <strong className="text-white">adult content</strong> intended only
          for viewers who are 18 years of age or older. By entering, you confirm that:
        </p>

        <ul className="text-left text-sm text-gray-300 space-y-2 mb-8 bg-surface-700 rounded-lg p-4">
          <li className="flex gap-2">
            <span className="text-brand-400 font-bold">✓</span>
            You are 18 years of age or older
          </li>
          <li className="flex gap-2">
            <span className="text-brand-400 font-bold">✓</span>
            Adult content is legal in your jurisdiction
          </li>
          <li className="flex gap-2">
            <span className="text-brand-400 font-bold">✓</span>
            You are not offended by sexually explicit material
          </li>
        </ul>

        <div className="flex gap-3">
          <button onClick={deny} className="btn-secondary flex-1 py-3">
            I am under 18
          </button>
          <button onClick={confirm} className="btn-primary flex-1 py-3 text-base font-semibold">
            Enter — I am 18+
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          By entering you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
