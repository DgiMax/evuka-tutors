"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { resendVerification } = useAuth();
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
      const origin = window.location.origin;
      await resendVerification(email, origin);
      setMessage("New link sent! Check your inbox.");
    } catch (error) {
      setMessage("Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm md:max-w-md">
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="text-center p-6 sm:p-7 border-b border-gray-100 bg-background"> 
          <div className="mx-auto mb-3" style={{ width: '180px', height: '64px' }}>
             <Image src="/logo.png" alt="Evuka Logo" width={180} height={64} className="object-contain" />
          </div>
          <h1 className="text-xl font-bold text-black">Verify Your Email</h1>
          <p className="text-gray-600 text-sm mt-1">Activation required.</p>
        </div>
        
        <div className="p-6 sm:p-7 text-center"> 
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2694C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4"><path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4"/><path d="m22 15-5-3-5 3-5-3-5 3v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5Z"/></svg>
          <p className="text-gray-700 text-sm mb-6">
            We sent a link to <b className="text-gray-800 break-all">{email || "your email"}</b>. Check your inbox to activate your account.
          </p>
          
          <div className="mb-6">
            <button onClick={handleResend} disabled={loading} className={`text-sm font-medium ${PRIMARY_TEXT_CLASS} hover:underline disabled:text-gray-400`}>
              {loading ? "Sending..." : "Resend verification email"}
            </button>
            {message && <p className="mt-2 text-xs text-green-600">{message}</p>}
          </div>
          
          <Link href="/login" className="block w-full">
            <button className={`w-full text-white py-3 rounded-md font-semibold ${PRIMARY_BUTTON_CLASS}`}>
              Back to Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}