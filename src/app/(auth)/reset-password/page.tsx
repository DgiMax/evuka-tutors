"use client";

import React, { useState } from "react";
import Input from "@/components/ui/FormInput";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import PublicRoute from "@/components/PublicRoute";
import Image from "next/image"; // Added Image import for logo

const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth(); // Get function from context

  // --- State Management ---
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Form Submission Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await forgotPassword(email);
      // Show the secure, non-revealing message from your backend
      setMessage("If an account with that email exists, a password reset link has been sent.");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
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
            Forgot Your Password?
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            We'll help you get back into your account.
          </p>
        </div>
        
        {/* Content Body */}
        <div className="w-full p-6 sm:p-7"> 
          
          {/* Conditionally render success message or the form */}
          {message ? (
            <div className="text-center">
              <p className="text-green-600 text-lg font-medium">{message}</p>
              
              {/* Optional: Add a button to return to login */}
              <Link href="/login" className="block w-full mt-6">
                <button 
                    type="button"
                    className={`w-full text-white py-3 rounded-md font-semibold ${PRIMARY_BUTTON_CLASS}`}
                >
                    ← Back to Log In
                </button>
              </Link>
            </div>
            
          ) : (
            <>
              <p className="text-center text-gray-600 text-sm mb-4">
                Enter your email address below and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-3 rounded-md font-semibold disabled:opacity-70 disabled:cursor-not-allowed ${PRIMARY_BUTTON_CLASS}`}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
      
      {/* Footer Link - Consistent look for the 'back to login' link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Remember your password?{" "}
          <Link href="/login" className={`${PRIMARY_TEXT_CLASS} font-medium hover:underline`}>
            Log In
          </Link>
        </p>
      </div>

    </div>
  );
}