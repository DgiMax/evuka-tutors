"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading || hasRedirected.current) return;

    if (user) {
      hasRedirected.current = true;
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) return <p>Loading...</p>;
  if (user) return null;

  return <>{children}</>;
}
