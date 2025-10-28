// src/app/verify-email/[token]/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Input from "@/components/ui/FormInput"; // Assuming you have this component

export default function VerifyTokenPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  // State to track the verification status: 'verifying', 'success', or 'error'
  const [status, setStatus] = useState("verifying");

  // State for the "resend email" form
  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  // --- Core Verification Logic ---
  useEffect(() => {
    if (token) {
      const decodedToken = decodeURIComponent(token);

      const handleVerification = async () => {
        try {
          await verifyEmail(decodedToken);
          setStatus("success");
        } catch (err) {
          setStatus("error");
        }
      };
      handleVerification();
    }
  }, [token, verifyEmail]);

  // --- Resend Email Handler ---
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
        setResendMessage("Please enter your email address.");
        return;
    }
    setResendLoading(true);
    setResendMessage(null);
    try {
        await resendVerification(resendEmail);
        setResendMessage("A new verification link has been sent.");
    } catch (error) {
        setResendMessage("Failed to resend. Please check the email and try again.");
    } finally {
        setResendLoading(false);
    }
  }


  // --- Conditional Rendering ---
  if (status === "verifying") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Verifying your account...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      // This is your EmailVerifiedPage UI
      <div className="flex items-center flex-col justify-center">
        <h1 className="text-2xl font-bold text-[#2694C6] mb-2">
          Email Verified!
        </h1>
        <div className="w-full max-w-md p-6 mx-4 bg-white rounded border border-gray-200 text-center">
          <img
            src="/auth/EmailConfirmed.svg"
            alt="Email Confirmed Illustration"
            className="object-contain w-48 h-36 mb-4 mx-auto"
          />
          <p className="text-gray-600 text-lg">
            Welcome to D-VUKA! Your account is now active.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full bg-[#2694C6] text-white py-2 rounded hover:bg-[#207ea9] transition-colors"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      // This is your LinkExpiredPage UI, now with functionality
      <div className="flex items-center flex-col justify-center">
        <h1 className="text-2xl font-bold text-[#ED1111] mb-2">
          Link Expired or Invalid
        </h1>
        <div className="w-full max-w-md p-6 mx-4 bg-white rounded border border-gray-200">
          <img
            src="/auth/LinkExpired.svg"
            alt="Link Expired Illustration"
            className="object-contain w-32 h-28 mb-4 mx-auto"
          />
          <p className="text-center text-gray-600 text-lg mb-4">
            This verification link is no longer valid.
          </p>
          <form onSubmit={handleResend} className="space-y-4">
            <p className="text-sm text-center">Enter your email to resend the link:</p>
            <Input 
                type="email"
                placeholder="your.email@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
            />
            <button
                type="submit"
                disabled={resendLoading}
                className="w-full bg-[#2694C6] text-white py-2 rounded hover:bg-[#207ea9] disabled:bg-gray-400"
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </button>
            {resendMessage && <p className="text-center text-sm text-green-600 pt-2">{resendMessage}</p>}
          </form>
          <div className="text-center mt-4">
            <p className="text-gray-500 text-md">
              Back to <Link href="/login" className="text-[#2694C6]">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null; // Should not be reached
}