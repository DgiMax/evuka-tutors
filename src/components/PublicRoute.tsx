"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/profile"); // redirect logged-in users
    }
  }, [user, loading, router]);

  if (loading) return <p>Loading...</p>;
  if (user) return null;

  return <>{children}</>;
}
