"use client";

import React, { useState } from "react";
import Input from "@/components/ui/FormInput";
import { useRouter } from "next/navigation";
import PublicRoute from "@/components/PublicRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 

export default function LogInPage() {
  const { login } = useAuth(); 
  const router = useRouter(); 

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="mx-auto w-full max-w-sm md:max-w-md"> 

        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          
          <div className="text-center p-6 sm:p-7 border-b border-gray-100 bg-background"> 
            <div className="mx-auto mb-3" style={{ width: '180px', height: '64px' }}>
               <Image
                src="/logo.png"
                alt="Evuka Logo"
                width={180}
                height={64}
                className="object-contain"
              />
            </div>
            <h1 className={`text-xl font-bold text-black`}>
              Sign In to evuka
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Access your personalized learning portal.
            </p>
          </div>
          
          <div className="w-full p-6 sm:p-7"> 
            
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="text"
                placeholder="Username or Email"
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

              <div className="text-right">
                <Link 
                  href="/reset-password" 
                  className={`text-sm ${PRIMARY_TEXT_CLASS} hover:underline`}
                >
                  Forgot Password?
                </Link>
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
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
            <Link href="/register" className={`${PRIMARY_TEXT_CLASS} font-medium hover:underline`}>
              Create a Free Account
            </Link>
          </p>
        </div>

      </div>
  );
}