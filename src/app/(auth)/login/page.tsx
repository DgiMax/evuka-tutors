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
      <h1 className="text-2xl font-bold text-[#2694C6] mb-2">
        Sign In to Your Account
      </h1>

      <div className="w-full max-w-2xl p-4 mx-4 bg-white rounded border border-gray-200">
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

      {/* Continue with Google / Apple */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm mb-4">Or Continue With</p>
        <div className="flex justify-center space-x-4">
          <button className="p-1 border border-gray-300 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 128 128">
              <path fill="#fff" d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.3 74.3 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.2 36.2 0 0 1-13.93 5.5a41.3 41.3 0 0 1-15.1 0A37.2 37.2 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.3 38.3 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.3 34.3 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.2 61.2 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38" />
              <path fill="#e33629" d="M44.59 4.21a64 64 0 0 1 42.61.37a61.2 61.2 0 0 1 20.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.3 34.3 0 0 0-13.64-8a37.17 37.17 0 0 0-37.46 9.74a39.25 39.25 0 0 0-9.18 14.91L8.76 35.6A63.53 63.53 0 0 1 44.59 4.21" />
              <path fill="#f8bd00" d="M3.26 51.5a63 63 0 0 1 5.5-15.9l20.73 16.09a38.3 38.3 0 0 0 0 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 0 1-5.5-40.9" />
              <path fill="#587dbd" d="M65.27 52.15h59.52a74.3 74.3 0 0 1-1.61 33.58a57.44 57.44 0 0 1-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0 0 12.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68" />
              <path fill="#319f43" d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0 0 44 95.74a37.2 37.2 0 0 0 14.08 6.08a41.3 41.3 0 0 0 15.1 0a36.2 36.2 0 0 0 13.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 0 1-25.9 13.47a67.6 67.6 0 0 1-32.36-.35a63 63 0 0 1-23-11.59A63.7 63.7 0 0 1 8.75 92.4" />
            </svg>
          </button>

          {/* Apple Icon */}
          <button className="p-1 border border-gray-300 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
              <g fill="none">
                <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                <path fill="#000" d="m13.064 6.685l.745-.306c.605-.24 1.387-.485 2.31-.33c1.891.318 3.195 1.339 3.972 2.693c.3.522.058 1.21-.502 1.429a2.501 2.501 0 0 0 .133 4.706c.518.17.81.745.64 1.263c-.442 1.342-1.078 2.581-1.831 3.581c-.744.988-1.652 1.808-2.663 2.209c-.66.26-1.368.163-2.045-.005l-.402-.107l-.597-.173c-.271-.079-.55-.147-.824-.147c-.275 0-.553.068-.824.147l-.597.173l-.402.107c-.677.168-1.386.266-2.045.005c-1.273-.504-2.396-1.68-3.245-3.067a13.5 13.5 0 0 1-1.784-4.986c-.227-1.554-.104-3.299.615-4.775c.74-1.521 2.096-2.705 4.163-3.053c.84-.141 1.562.048 2.14.265l.331.13l.584.241c.4.157.715.249 1.064.249c.348 0 .664-.092 1.064-.249m-1.296-3.917c.976-.977 2.475-1.061 2.828-.707c.354.353.27 1.852-.707 2.828c-.976.976-2.475 1.06-2.828.707c-.354-.353-.27-1.852.707-2.828" />
              </g>
            </svg>
          </button>
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
