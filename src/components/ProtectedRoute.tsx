"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Prevent multiple redirects
  const hasRedirected = useRef(false);

  // Define public/allowed routes inside the ProtectedRoute
  // The onboarding page must be an allowed route for logged-in but un-profiled users.
  const isAllowedAuthRoute = pathname === "/onboarding";


  useEffect(() => {
    if (loading || hasRedirected.current) return;

    // --- 1. UNAUTHENTICATED REDIRECT ---
    if (!user) {
      // Allow public routes defined in AuthContext to handle themselves.
      // If we hit ProtectedRoute, assume it's protected.
      hasRedirected.current = true;

      // Encode the return URL safely
      const safeReturnUrl =
        pathname && pathname !== "/login"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";

      router.replace(`/login${safeReturnUrl}`);
      return;
    }

    // --- 2. LOGGED-IN REDIRECT (Onboarding Check) ---
    // Rule: If user is logged in AND is neither a tutor nor a student,
    // they must go to /onboarding, unless they are already there.
    const needsOnboarding = user && !user.is_tutor && !user.is_student;

    if (needsOnboarding && !isAllowedAuthRoute) {
        hasRedirected.current = true;
        router.replace("/onboarding");
        return;
    }
    
    // Rule: If user is fully profiled, they shouldn't be on /onboarding anymore.
    const isFullyProfiled = user.is_tutor || user.is_student;
    
    if (isFullyProfiled && isAllowedAuthRoute) {
        hasRedirected.current = true;
        // Redirect them to home/dashboard if they try to access /onboarding again
        router.replace("/");
        return;
    }

  }, [user, loading, router, pathname, isAllowedAuthRoute]);

  // Show loading while auth is resolving
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

  // --- RENDERING GUARDS ---

  // 1. User is not authenticated OR (User is authenticated AND needs redirect)
  if (!user || (!user.is_tutor && !user.is_student && !isAllowedAuthRoute)) {
      // If we are here, either they are redirecting to /login, or they are redirecting to /onboarding.
      // Prevent rendering the content until the navigation is complete.
      return null;
  }
  
  // 2. User is authenticated and allowed on this path (either fully profiled, or on /onboarding)
  return <>{children}</>;
}