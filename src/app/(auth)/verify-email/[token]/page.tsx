"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/ui/FormInput"; 
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import PublicRoute from "@/components/PublicRoute";
import Image from "next/image"; // Added Image import for logo

const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 
const ERROR_TEXT_CLASS = "text-[#ED1111]";

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
        setResendMessage("Success! A new verification link has been sent.");
    } catch (error) {
        setResendMessage("Failed to resend. Please check the email and try again.");
    } finally {
        setResendLoading(false);
    }
  }


  // --- Helper Component for Card Structure ---
  const AuthCard = ({ title, children, showLogo = true, titleClass = 'text-black' }: { title: string, children: React.ReactNode, showLogo?: boolean, titleClass?: string }) => (
    <div className="mx-auto w-full max-w-sm md:max-w-md"> 
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        
        {/* Header Section */}
        <div className="text-center p-6 sm:p-7 border-b border-gray-100 bg-background"> 
          {showLogo && (
            <div className="mx-auto mb-3" style={{ width: '180px', height: '64px' }}>
              <Image
                  src="/logo.png"
                  alt="Evuka Logo"
                  width={180}
                  height={64}
                  className="object-contain"
              />
            </div>
          )}
          <h1 className={`text-xl font-bold ${titleClass}`}>
            {title}
          </h1>
        </div>
        
        {/* Content Body */}
        <div className="w-full p-6 sm:p-7"> 
          {children}
        </div>
      </div>
    </div>
  );


  // --- Conditional Rendering ---
  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <AuthCard title="Verifying Account" showLogo={false}>
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <svg className="animate-spin h-8 w-8 text-[#2694C6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Please wait while we confirm your email...</p>
          </div>
        </AuthCard>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <AuthCard title="Email Verified!" titleClass={PRIMARY_TEXT_CLASS}>
          <div className="text-center">
            {/* Success Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2694C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle mx-auto mb-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>

            <p className="text-gray-700 text-lg mb-6">
              Welcome to Evuka! Your account is now active and ready to go.
            </p>
            
            {/* Button matching primary style */}
            <button
              onClick={() => router.push("/login")}
              className={`mt-2 w-full text-white py-3 rounded-md font-semibold ${PRIMARY_BUTTON_CLASS}`}
            >
              Proceed to Login
            </button>
          </div>
        </AuthCard>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <AuthCard title="Link Invalid or Expired" titleClass={ERROR_TEXT_CLASS}>
          <div className="text-center">
            {/* Error Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ED1111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle mx-auto mb-4"><path d="m21.73 18-9-15-9 15h18Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            
            <p className="text-gray-700 mb-4">
              This verification link is no longer valid or was used already.
            </p>

            <p className="text-sm text-gray-600 mb-4">
              **Enter your email** to receive a new verification link:
            </p>

            {/* Resend Form */}
            <form onSubmit={handleResend} className="space-y-4">
              <Input 
                  type="email"
                  placeholder="your.email@example.com"
                  value={resendEmail}
                  onChange={(e: any) => setResendEmail(e.target.value)}
                  required
              />
              
              {resendMessage && <p className="text-center text-sm text-green-600 pt-2">{resendMessage}</p>}
              
              <button
                  type="submit"
                  disabled={resendLoading}
                  className={`w-full text-white py-3 rounded-md font-semibold disabled:opacity-70 disabled:cursor-not-allowed ${PRIMARY_BUTTON_CLASS}`}
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </button>
            </form>
            
          </div>
        </AuthCard>
        
        {/* Consistent Footer Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Back to{" "}
            <Link href="/login" className={`${PRIMARY_TEXT_CLASS} font-medium hover:underline`}>
              Log In
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return null;
}