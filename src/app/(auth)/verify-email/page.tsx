"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image"; // Added Image import for logo

const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 

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
    // Outer container matching the login page width
    <div className="mx-auto w-full max-w-sm md:max-w-md">

      {/* Card Wrapper - matching login page's rounded-md, border, and overflow */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        
        {/* Header Section - Identical style and structure to the login page */}
        <div className="text-center p-6 sm:p-7 border-b border-gray-100 bg-background"> 
          <div className="mx-auto mb-3" style={{ width: '180px', height: '64px' }}>
             <Image
                src="/logo.png" // Assumed path from your login page
                alt="Evuka Logo"
                width={180}
                height={64}
                className="object-contain"
              />
          </div>
          <h1 className={`text-xl font-bold text-black`}>
            Verify Your Email Address
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Account activation required.
          </p>
        </div>
        
        {/* Content Body */}
        <div className="w-full p-6 sm:p-7 text-center"> 
          
          <div className="flex flex-col items-center justify-center">
            {/* Using a central icon/illustration placeholder */}
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2694C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail mb-4"><path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4"/><path d="m22 15-5-3-5 3-5-3-5 3v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5Z"/></svg>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-gray-700">
              We’ve sent a verification link to{" "}
              <b className="text-gray-800 font-semibold break-all">{email || "your email"}</b>. Please check
              your inbox and click the link to activate your account.
            </p>
            
            {/* Resend button section */}
            <div className="text-gray-500 text-sm mt-4">
              Didn’t receive the email?{" "}
              <button
                onClick={handleResend}
                disabled={loading}
                className={`font-medium disabled:text-gray-400 disabled:cursor-not-allowed ${PRIMARY_TEXT_CLASS} hover:underline`}
              >
                {loading ? "Sending..." : "Resend verification email"}
              </button>
            </div>
            
            {/* Display feedback message for the resend action */}
            {message && (
              <p className="mt-2 text-sm text-green-600">{message}</p>
            )}
          </div>
          
          {/* Back to Login Button - Matched login button style (py-3, rounded-md) */}
          <Link href="/login" className="block w-full">
            <button
              className={`w-full text-white py-3 rounded-md font-semibold ${PRIMARY_BUTTON_CLASS}`}
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
    // Added flex centering to match the rest of the auth flow's container style
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <Suspense fallback={<div>Loading verification details...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}