"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/ui/FormInput"; 
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 
const ERROR_TEXT_CLASS = "text-[#ED1111]";

export default function VerifyTokenPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const hasTriggered = useRef(false);

  const [status, setStatus] = useState("verifying");
  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (token && !hasTriggered.current) {
      hasTriggered.current = true;
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

  const AuthCard = ({ title, children, showLogo = true, titleClass = 'text-black' }: { title: string, children: React.ReactNode, showLogo?: boolean, titleClass?: string }) => (
    <div className="mx-auto w-full max-w-sm md:max-w-md"> 
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="text-center p-6 sm:p-7 border-b border-gray-100 bg-background"> 
          {showLogo && (
            <div className="mx-auto mb-3" style={{ width: '180px', height: '64px' }}>
              <Image src="/logo.png" alt="Evuka Logo" width={180} height={64} className="object-contain" />
            </div>
          )}
          <h1 className={`text-xl font-bold ${titleClass}`}>{title}</h1>
        </div>
        <div className="w-full p-6 sm:p-7">{children}</div>
      </div>
    </div>
  );

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <AuthCard title="Verifying Account" showLogo={false}>
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <svg className="animate-spin h-8 w-8 text-[#2694C6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Confirming your email...</p>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2694C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
            <p className="text-gray-700 mb-6">Welcome to Evuka! Your account is active.</p>
            <button onClick={() => router.push("/login")} className={`w-full text-white py-3 rounded-md font-semibold ${PRIMARY_BUTTON_CLASS}`}>
              Proceed to Login
            </button>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <AuthCard title="Link Invalid" titleClass={ERROR_TEXT_CLASS}>
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ED1111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4"><path d="m21.73 18-9-15-9 15h18Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          <p className="text-gray-700 mb-4 text-sm">This link has expired or was already used.</p>
          <form onSubmit={handleResend} className="space-y-4">
            <Input type="email" placeholder="Email address" value={resendEmail} onChange={(e: any) => setResendEmail(e.target.value)} required />
            {resendMessage && <p className="text-sm text-green-600">{resendMessage}</p>}
            <button type="submit" disabled={resendLoading} className={`w-full text-white py-3 rounded-md font-semibold ${PRIMARY_BUTTON_CLASS}`}>
              {resendLoading ? "Sending..." : "Resend Link"}
            </button>
          </form>
        </div>
      </AuthCard>
    </div>
  );
}