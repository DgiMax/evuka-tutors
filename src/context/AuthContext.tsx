"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api/axios";

// 1. AXIOS TYPE DECLARATION
declare module "axios" {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

/* TYPES -------------------------------------------------------------- */

interface Organization {
  organization_name: string;
  organization_slug: string;
  role?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  is_tutor?: boolean;
  is_student?: boolean;
  organizations?: Organization[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  fetchCurrentUser: (skipRefresh?: boolean) => Promise<User | null>;
}

/* CONTEXT -------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname(); // Better than window.location.pathname for Next.js
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* TOKEN AUTO-REFRESH LOGIC (FIXED) ----------------------------------- */

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // 1. Skip refresh for auth endpoints to prevent loops
        const skipFor = ["/users/login/", "/users/register/", "/users/verify-email/"];
        if (skipFor.some((path) => originalRequest?.url?.includes(path))) {
          return Promise.reject(error);
        }

        // 2. Prevent infinite loops if already retried
        if (originalRequest._retry) {
          return Promise.reject(error);
        }

        // 3. Handle 401 Unauthorized
        if (error.response?.status === 401) {
          originalRequest._retry = true;

          try {
            // Attempt refresh
            await api.post("/users/refresh/", null, {
                _skipAuthRefresh: true, // Important: Don't intercept this call itself
            });

            // Retry original request
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh failed = Session Expired
            setUser(null);
            // Optional: Add ?session_expired=true logic if you want
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  /* FETCH CURRENT USER ------------------------------------------------ */

  const fetchCurrentUser = async (skipRefresh = false) => {
    try {
      // Don't use skipRefresh in the config unless you really mean to skip the INTERCEPTOR logic
      // usually fetching me should allow refresh if token is stale
      const response = await api.get<User>("/users/me/");
      setUser(response.data);
      return response.data;
    } catch {
      // Do NOT set user to null here immediately, let the interceptor handle 401s.
      // If it's a network error, we don't want to logout the user.
      // Only set null if it's strictly a 401 that failed refresh (handled above) 
      // or if we are doing an initial check.
      return null;
    }
  };

  /* INITIAL LOAD ------------------------------------------------------- */
  
  useEffect(() => {
    const init = async () => {
      const userData = await fetchCurrentUser();
      if (!userData) {
          setUser(null);
      }
      setLoading(false);
    };
    init();
  }, []);

  /* AUTH REDIRECT LOGIC ---------------------------------------------- */

  useEffect(() => {
    if (loading) return;

    // Use Next.js pathname hook instead of window.location
    const path = pathname;

    const publicRoutes = [
      "/login",
      "/register",
      "/forgot-password",
      "/verify-email",
      "/reset-password",
      "/check-email",
    ];

    const isPublicRoute = publicRoutes.some((route) => {
      if (path === route) return true;
      if (path?.startsWith(`${route}/`)) return true;
      return false;
    });

    const isOnboardingRoute = path?.startsWith("/onboarding");

    // 1. Not Logged In
    if (!user) {
      if (!isPublicRoute) {
        // Save where they were trying to go
        sessionStorage.setItem("postLoginRedirect", path || "/");
        router.replace("/login");
      }
      return;
    }

    // 2. Logged In but on Public Route -> Go Home
    if (user && isPublicRoute) {
      router.replace("/");
      return;
    }

    // 3. Logged In but incomplete profile -> Onboarding
    if (user && !user.is_tutor && !user.is_student && !isOnboardingRoute) {
      router.replace("/onboarding");
    }
  }, [user, loading, pathname, router]);

  /* LOGIN ------------------------------------------------------------- */

  const login = async (username: string, password: string) => {
    try {
      await api.post("/users/login/", { username, password });
      const userData = await fetchCurrentUser(); // Get fresh user data

      const redirect = sessionStorage.getItem("postLoginRedirect");

      if (redirect) {
        sessionStorage.removeItem("postLoginRedirect");
        router.push(redirect);
      } else {
        router.push("/");
      }
    } catch (error) {
      throw error;
    }
  };

  /* LOGOUT ------------------------------------------------------------ */

  const logout = async () => {
    try {
      await api.post("/users/logout/");
    } catch {}
    setUser(null);
    router.push("/login");
  };

  /* OTHER AUTH FUNCTIONS --------------------------------------------- */

  const register = async (username: string, email: string, password: string) => {
    await api.post("/users/register/", { username, email, password });
    router.push("/check-email");
  };

  const forgotPassword = async (email: string) => {
    await api.post("/users/forgot-password/", { email });
  };

  const resetPassword = async (token: string, password: string) => {
    await api.post(`/users/reset-password/${token}/`, { password });
  };

  const verifyEmail = async (token: string) => {
    await api.post("/users/verify-email/", { token });
  };

  const resendVerification = async (email: string) => {
    await api.post("/users/resend-verification/", { email });
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await api.post("/users/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        changePassword,
        fetchCurrentUser,
      }}
    >
      {/* Standard pattern: Don't render children until initial load is done 
         to prevent redirects flashing 
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

/* HOOK --------------------------------------------------------------- */

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};