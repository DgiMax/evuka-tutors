"use client";

import React from "react";
import Link from "next/link";
import PublicRoute from "@/components/PublicRoute";

export default function ResetPasswordSuccessPage() {
  return (
    <PublicRoute>
      <div className="flex items-center flex-col justify-center">
        <h1 className="text-2xl font-bold text-[#2694C6] mb-2">
          Password Reset Successful
        </h1>
        <div className="w-full max-w-md p-6 mx-4 bg-white rounded border border-gray-200">
          <img
            src="/auth/PasswordResetSuccess.svg"
            alt="Reset Password Success Illustration"
            className="object-contain w-48 h-36 mb-4 mx-auto"
          />
          <div className="text-center mb-4">
            <p className="text-gray-600 text-lg">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
          </div>
          {/* Use Next.js Link for client-side navigation */}
          <Link href="/login">
            <button className="w-full bg-[#2694C6] text-white py-2 rounded hover:bg-[#207ea9] transition-colors">
              ← Log In Now
            </button>
          </Link>
        </div>
      </div>
    </PublicRoute>
  );
}