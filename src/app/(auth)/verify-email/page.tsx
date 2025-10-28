// src/app/verify-email/page.tsx

"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// A small component to handle the logic, wrapped in Suspense
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resendVerification } = useAuth();

  // Get the email from the URL, e.g., /verify-email?email=user@example.com
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) {
      setMessage("Email address not found.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await resendVerification(email);
      setMessage("Success! A new verification link has been sent to your email.");
    } catch (error) {
      setMessage("Failed to resend email. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center flex-col justify-center">
      <h1 className="text-2xl font-bold text-[#2694C6] mb-2">
        Verify Your Email Address
      </h1>

      <div className="w-full max-w-lg p-6 mx-4 bg-white rounded border border-gray-200">
        <div className="flex flex-col items-center justify-center">
          <img
            src="/auth/VerifyEmail.svg"
            alt="Verify Email Illustration"
            className="object-contain w-36 h-28 mb-4"
          />
        </div>
        <div className="text-center mb-4">
          <p className="text-gray-600 text-lg">
            We’ve sent a verification link to{" "}
            <b className="text-gray-800">{email || "your email"}</b>. Please check
            your inbox and click the link to activate your account.
          </p>
          <div className="text-gray-500 text-md mt-4">
            Didn’t receive the email?{" "}
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-[#2694C6] hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {loading ? "Sending..." : "Resend verification email"}
            </button>
          </div>
          {/* Display feedback message for the resend action */}
          {message && (
            <p className="mt-2 text-sm text-green-600">{message}</p>
          )}
        </div>
        <div className="flex justify-center mt-4">
          <Link href="/login">
            <button
              className="bg-[#2694C6] text-white px-6 py-2 rounded-md hover:bg-[#207ea9] transition-colors"
              style={{ borderRadius: "2px" }}
            >
              ← Back to Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// The final exported page component wraps the content in a Suspense boundary
// This is required by Next.js when using useSearchParams
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}