"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#EFFAFC"; // make sure body matches background
    return () => {
      document.body.style.overflow = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-start justify-center overflow-hidden p-6"
      style={{
        backgroundColor: "#EFFAFC",
      }}
    >
      {/* Auth Page Content */}
      <div className="w-full max-w-md px-6">{children}</div>

      {/* Back to Home Button */}
      <Link
        href="/"
        className="fixed bottom-6 left-6 px-4 py-2 font-medium text-gray-800 border border-gray-300 hover:opacity-90 transition"
        style={{
          backgroundColor: "#FFEF00",
          borderRadius: "2px",
        }}
      >
        ← Back to Home
      </Link>
    </div>
  );
}
