"use client";

import React from "react";
import Link from "next/link";
import PublicRoute from "@/components/PublicRoute";
import Image from "next/image"; // Added Image import for logo

const PRIMARY_BUTTON_CLASS = "bg-primary hover:bg-[#1f7ba5] transition-colors"; 

export default function ResetPasswordSuccessPage() {
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
            Password Reset Successful
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            You're all set!
          </p>
        </div>
        
        {/* Content Body */}
        <div className="w-full p-6 sm:p-7 text-center"> 
          
          {/* Using a central icon/illustration if available, otherwise removing the image entirely to keep it clean */}
          <div className="mb-4 flex justify-center">
            {/* You can replace this with a success icon from your library (e.g., Lucide CheckCircle) */}
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2694C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>
          
          <p className="text-gray-700 mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          
          {/* Log In Button - Matched login button style (py-3, rounded-md) */}
          <Link href="/login" className="block w-full">
            <button 
                type="button"
                className={`w-full text-white py-3 rounded-md font-semibold ${PRIMARY_BUTTON_CLASS}`}
            >
              ← Log In Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}