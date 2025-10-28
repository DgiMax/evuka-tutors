"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/ui/FormInput";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import PublicRoute from "@/components/PublicRoute";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth(); // Get function from context
  const params = useParams(); // Hook to get URL parameters
  const router = useRouter(); // Hook for navigation

  // Extract the token from the URL
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
    <PublicRoute>
      <div className="flex items-center flex-col justify-center">
        <h1 className="text-2xl font-bold text-[#2694C6] mb-2">
          Reset Your Password
        </h1>
        <div className="w-full max-w-lg p-6 mx-4 bg-white rounded border border-gray-200">
          <img
            src="/auth/PasswordReset.svg"
            alt="Reset Password Illustration"
            className="object-contain w-48 h-36 mb-4 mx-auto"
          />
          <p className="text-center text-gray-600 text-lg mb-4">
            Choose a strong, secure password for your account.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2">
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
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2694C6] text-white py-2 rounded hover:bg-[#207ea9] transition-colors disabled:bg-gray-400"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
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