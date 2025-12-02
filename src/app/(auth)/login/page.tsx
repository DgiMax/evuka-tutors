"use client";

import React, { useState } from "react";
import Input from "@/components/ui/FormInput";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import GoogleLoginBtn from "@/components/ui/GoogleLoginBtn";
import { Eye, EyeOff } from "lucide-react"; 

// Keep your constants
const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors";

export default function LogInPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // 2. Added Visibility State
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      // Redirect is usually handled here or inside useAuth
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.detail || 
        err.response?.data?.non_field_errors?.[0] || 
        err.message || 
        "Login failed. Please check your credentials.";
        
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm md:max-w-md">
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        
        {/* Header Section */}
        <div className="text-center p-6 sm:p-7 border-b border-gray-100 bg-background">
          <div className="mx-auto mb-3" style={{ width: "180px", height: "64px" }}>
            <Image
              src="/logo.png"
              alt="Evuka Logo"
              width={180}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className={`text-xl font-bold text-black`}>Sign In to evuka</h1>
          <p className="text-gray-600 text-sm mt-1">
            Access your personalized learning portal.
          </p>
        </div>

        {/* Form Section */}
        <div className="w-full p-6 sm:p-7">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="Username or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            
            {/* 3. Password Input with Toggle */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                // Added padding right to prevent text overlap with icon
                className="pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="text-right">
              <Link
                href="/reset-password"
                className={`text-sm ${PRIMARY_TEXT_CLASS} hover:underline`}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-md font-semibold disabled:opacity-70 ${PRIMARY_BUTTON_CLASS}`}
            >
              {loading ? "Signing In..." : "Log In"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <Link
            href="/register"
            className={`${PRIMARY_TEXT_CLASS} font-medium hover:underline`}
          >
            Create a Free Account
          </Link>
        </p>
      </div>

      <div className="flex justify-center py-6">
          <GoogleLoginBtn />
      </div>
    </div>
  );
}