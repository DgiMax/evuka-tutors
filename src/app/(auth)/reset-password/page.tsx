"use client";

import React, { useState } from "react";
import Input from "@/components/ui/FormInput";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import PublicRoute from "@/components/PublicRoute";

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
    <PublicRoute>
      <div className="flex items-center flex-col justify-center">
        <h1 className="text-2xl font-bold text-[#2694C6] mb-2">
          Forgot Your Password?
        </h1>
        <div className="w-full max-w-lg p-6 mx-4 bg-white rounded border border-gray-200">
          <img
            src="/auth/ForgotPassword.svg"
            alt="Forgot Password Illustration"
            className="object-contain w-48 h-36 mb-4 mx-auto"
          />
          {/* Conditionally render success message or the form */}
          {message ? (
            <div className="text-center">
              <p className="text-green-600 text-lg">{message}</p>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-600 text-lg mb-4">
                Enter your email address and we’ll send you instructions to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-2">
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
                  className="w-full bg-[#2694C6] text-white py-2 rounded hover:bg-[#207ea9] transition-colors disabled:bg-gray-400"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
          <div className="text-center mt-4">
            <p className="text-gray-500 text-md">
              Back to <Link href="/login" className="text-[#2694C6] hover:underline">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
}