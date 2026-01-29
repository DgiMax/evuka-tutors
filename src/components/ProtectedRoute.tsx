"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const hasRedirected = useRef(false);

  const isAllowedAuthRoute = pathname === "/onboarding";


  useEffect(() => {
    if (loading || hasRedirected.current) return;

    if (!user) {
      hasRedirected.current = true;

      const safeReturnUrl =
        pathname && pathname !== "/login"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";

      router.replace(`/login${safeReturnUrl}`);
      return;
    }

    const needsOnboarding = user && !user.is_tutor && !user.is_student;

    if (needsOnboarding && !isAllowedAuthRoute) {
        hasRedirected.current = true;
        router.replace("/onboarding");
        return;
    }
    
    const isFullyProfiled = user.is_tutor || user.is_student;
    
    if (isFullyProfiled && isAllowedAuthRoute) {
        hasRedirected.current = true;
        router.replace("/");
        return;
    }

  }, [user, loading, router, pathname, isAllowedAuthRoute]);

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

  if (!user || (!user.is_tutor && !user.is_student && !isAllowedAuthRoute)) {
      return null;
  }
  
  return <>{children}</>;
}