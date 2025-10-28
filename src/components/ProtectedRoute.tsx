"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent redirect if already redirected or still loading
    if (loading || hasRedirected.current) return;

    if (!user) {
      console.log('[ProtectedRoute] No user found, redirecting to login');
      hasRedirected.current = true;
      
      // Preserve the intended destination for redirect after login
      const returnUrl = pathname !== '/login' ? `?next=${pathname}` : '';
      router.replace(`/login${returnUrl}`);
    }
  }, [user, loading, router, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2694C6] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}