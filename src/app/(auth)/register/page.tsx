"use client";

import React, { useState } from "react";
import Input from "@/components/ui/FormInput"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; 
import Link from "next/link";
import Image from "next/image"; 
import { Eye, EyeOff, Info } from "lucide-react"; 
import GoogleLoginBtn from "@/components/ui/GoogleLoginBtn";

const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth(); 

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const origin = window.location.origin;
      await register(username, email, password, origin); 
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      let errorMessage = "Registration failed. Please try again.";

      if (err.response?.data) {
          const data = err.response.data;
          if (data.detail) errorMessage = data.detail;
          else if (data.non_field_errors) errorMessage = data.non_field_errors[0];
          else {
              const firstKey = Object.keys(data)[0];
              if (firstKey && Array.isArray(data[firstKey])) {
                  errorMessage = `${firstKey.charAt(0).toUpperCase() + firstKey.slice(1)}: ${data[firstKey][0]}`;
              }
          }
      } else if (err.message) {
          errorMessage = err.message;
      }

      setError(errorMessage);
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
            Create Your Evuka Account
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Access your personalized learning portal.
          </p>
        </div>
        
        <div className="w-full p-6 sm:p-7"> 
          
          <form onSubmit={handleRegister} className="space-y-4">
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

            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex gap-3 items-start text-left">
              <Info className={`w-4 h-4 mt-0.5 shrink-0 ${PRIMARY_TEXT_CLASS}`} />
              <div className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-800">Password Requirements:</span>
                <ul className="list-disc pl-3 mt-1 space-y-0.5">
                  <li>At least 1 uppercase letter (A-Z)</li>
                  <li>At least 1 symbol (@, #, !, etc.)</li>
                  <li>At least 1 number (0-9)</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

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
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className={`${PRIMARY_TEXT_CLASS} font-medium hover:underline`}>
            Sign In
          </Link>
        </p>
      </div>

      <div className="flex justify-center py-6">
        <GoogleLoginBtn />
      </div>

    </div>
  );
}