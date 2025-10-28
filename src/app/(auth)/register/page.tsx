// src/app/register/page.tsx

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/FormInput";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import PublicRoute from "@/components/PublicRoute"; // Assuming you have this component

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth(); // Get the register function from context

  // --- State Management ---
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- UI Feedback State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Form Submission Handler ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // Reset UI state
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await register(username, email, password);
      // 3. On success, redirect to the verify-email page with the email as a query parameter
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      
    } catch (err: any) {
      const errorMessage = err.message.replace(/["{}[\]]/g, '');
      setError(errorMessage || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicRoute>
      <div className="flex items-center flex-col justify-center">
        <h1 className="text-2xl font-bold text-[#2694C6] mb-2">
          Create Your Account
        </h1>

        <div className="w-full max-w-xl p-4 mx-4 bg-white rounded border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Illustration Column */}
            <div className="hidden md:flex flex-col items-center justify-center">
              <img
                src="/auth/Register.svg"
                alt="A person looking at educational items"
                width="256"
                height="320"
                className="object-contain"
              />
            </div>

            <div className="w-full">
              {/* Conditional Rendering: Show success message or registration form */}
              {success ? (
                <div className="text-center p-4">
                  <p className="text-green-600 text-lg font-semibold">{success}</p>
                  <p className="mt-2 text-gray-600">
                    You can close this page now.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Create Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Enter Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Create Password"
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

                  {/* Display error message if it exists */}
                  {error && (
                    <p className="text-red-500 text-sm text-center pt-1">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#2694C6] text-white py-2 rounded-md hover:bg-[#207ea9] transition-colors disabled:bg-gray-400"
                    style={{ borderRadius: "2px" }}
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Social Logins and Link to Sign In */}
        <div className="mt-6 text-center">
           <p className="text-gray-500 text-sm mb-4">Or Continue With</p>
           {/* ... your social login buttons ... */}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2694C6] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </PublicRoute>
  );
}