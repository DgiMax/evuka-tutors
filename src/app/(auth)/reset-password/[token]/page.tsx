"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/ui/FormInput";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import PublicRoute from "@/components/PublicRoute";
import Image from "next/image"; // Added Image import for logo

const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth(); // Get function from context
  const params = useParams(); // Hook to get URL parameters
  const router = useRouter(); // Hook for navigation

  // Extract the token from the URL
  // NOTE: You should ensure your component is placed within a dynamic route
  const token = params.token as string; 

  // --- State Management ---
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Form Submission Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Ensure the token exists before calling the API
      if (!token) {
        setError("Missing or invalid reset token.");
        setLoading(false);
        return;
      }

      await resetPassword(token, password);
      
      // On success, navigate to the dedicated success page
      router.push("/password-reset-success");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may be invalid or expired.");
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
            Reset Your Password
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Choose a new, secure password for your account.
          </p>
        </div>
        
        {/* Form Body */}
        <div className="w-full p-6 sm:p-7"> 
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Create New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-md font-semibold disabled:opacity-70 disabled:cursor-not-allowed ${PRIMARY_BUTTON_CLASS}`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
      
      {/* Footer Link - Consistent look for the 'back to login' link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Done resetting?{" "}
          <Link href="/login" className={`${PRIMARY_TEXT_CLASS} font-medium hover:underline`}>
            Log In
          </Link>
        </p>
      </div>

    </div>
  );
}