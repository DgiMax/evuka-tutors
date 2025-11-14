"use client";

import React, { useState } from "react";
import Input from "@/components/ui/FormInput";
import { useRouter } from "next/navigation";
import PublicRoute from "@/components/PublicRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LogInPage() {
  const { login } = useAuth(); // ✅ 2. Get the login function from the context

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ✅ 3. Call the login function from the context
      await login(username, password);
      // The context will handle saving tokens, setting state, and redirecting
      
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicRoute>
    <div className="flex items-center flex-col justify-center">
      <h1 className="text-3xl font-bold text-[#2694C6] mb-4">
        Sign In
      </h1>

      <div className="w-full max-w-xl p-4 mx-4 bg-white rounded border border-gray-200">
        <div className="text-center mb-2">
          <p className="text-gray-600 text-lg text-bold">
            Access your courses, track progress, and connect with your community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Illustration */}
          <div className="hidden md:flex flex-col items-center justify-center">
            <img
              src="/auth/LogIn.svg"
              alt="A person looking at educational items, illustrating learning"
              width="256"
              height="320"
              className="object-contain"
            />
          </div>

          {/* Login Form */}
          <div className="w-full">
            <form onSubmit={handleLogin} className="space-y-2">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* --- ✅ ADD THIS BLOCK --- */}
              <div className="text-right">
                <Link 
                  href="/reset-password" 
                  className="text-sm text-[#2694C6] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              {/* --- END OF ADDED BLOCK --- */}

              {error && (
                <p className="text-red-500 text-sm mb-1 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2694C6] text-white py-2 rounded-md hover:bg-[#207ea9] transition-colors"
                style={{ borderRadius: "2px" }}
              >
                {loading ? "Signing In..." : "Log In"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <a href="/register" className="text-[#2694C6] hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
    </PublicRoute>
  );
}
