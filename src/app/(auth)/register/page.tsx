"use client";

import React, { useState } from "react";
// Assuming "@/components/ui/FormInput" is your Input component
import Input from "@/components/ui/FormInput"; 
import { useRouter } from "next/navigation";
// Assuming "@/context/AuthContext" provides your authentication logic
import { useAuth } from "@/context/AuthContext"; 
import Link from "next/link";
import Image from "next/image"; // Kept Image import for logo placement

const PRIMARY_TEXT_CLASS = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 

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

    try {
      // Assuming your register function handles user creation and email verification setup
      await register(username, email, password); 
      
      // On success, redirect to the verify-email page
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      
    } catch (err: any) {
      // Clean up error message (if necessary)
      const errorMessage = err.message || "Registration failed. Please try again.";
      setError(errorMessage);
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
            Create Your Evuka Account
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Access your personalized learning portal.
          </p>
        </div>
        
        {/* Form Body */}
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

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
            )}

            {/* Submit Button - Identical styling to login button */}
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
      
      {/* Footer Link - Identical styling and structure to login footer */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className={`${PRIMARY_TEXT_CLASS} font-medium hover:underline`}>
            Sign In
          </Link>
        </p>
      </div>

    </div>
  );
}