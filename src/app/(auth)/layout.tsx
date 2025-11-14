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
      <div className="w-full max-w-2xl px-6">{children}</div>


    </div>
  );
}
