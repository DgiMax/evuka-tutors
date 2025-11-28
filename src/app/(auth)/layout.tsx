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
      className="fixed inset-0 flex items-start justify-center overflow-y-auto p-6"
      style={{
        backgroundColor: "#EFFAFC",
      }}
    >
      {children}
    </div>
  );
}
