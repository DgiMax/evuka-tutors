"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
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
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* TOKEN AUTO-REFRESH LOGIC ----------------------------------- */
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const skipFor = ["/users/login/", "/users/register/", "/users/verify-email/"];
        
        if (skipFor.some((path) => originalRequest?.url?.includes(path))) {
          return Promise.reject(error);
        }
        if (originalRequest._retry) {
          return Promise.reject(error);
        }
        if (error.response?.status === 401) {
          originalRequest._retry = true;
          try {
            await api.post("/users/refresh/", null, { _skipAuthRefresh: true });
            return api(originalRequest);
          } catch (refreshError) {
            // Force logout on refresh fail
            setUser(null);
            localStorage.removeItem("activeOrgSlug"); // <--- SAFETY CLEAR
            localStorage.removeItem("activeOrgRole"); // <--- SAFETY CLEAR
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  /* FETCH CURRENT USER ------------------------------------------------ */
  const fetchCurrentUser = useCallback(async (skipRefresh = false) => {
    try {
      const response = await api.get<User>("/users/me/");
      setUser(response.data);
      return response.data;
    } catch {
      return null;
    }
  }, []);

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
  }, [fetchCurrentUser]);

  /* 🛡️ TUTOR-SIDE REDIRECT LOGIC --------------------------------------- */
  useEffect(() => {
    if (loading) return; 

    const path = pathname || "/";
    const isOnboardingRoute = path.startsWith("/onboarding");
    
    const publicRoutes = [
      "/login", "/register", "/forgot-password", 
      "/verify-email", "/reset-password", "/check-email", "/auth/google"
    ];
    const isPublicRoute = publicRoutes.some(r => path === r || path.startsWith(`${r}/`));

    // 1. Guest User Logic
    if (!user) {
      if (!isPublicRoute && !isOnboardingRoute) { 
        sessionStorage.setItem("postLoginRedirect", path);
        router.replace("/login");
      }
      return;
    }

    // 2. Authenticated But NOT A Tutor -> Force Onboarding
    if (!user.is_tutor) {
      if (!isOnboardingRoute) {
        router.replace("/onboarding");
      }
      return;
    }

    // 3. Authenticated AND Is Tutor -> Block Public/Onboarding
    if (user.is_tutor) {
      if (isPublicRoute || isOnboardingRoute) {
        router.replace("/");
      }
    }

  }, [user, loading, pathname, router]);

  /* AUTH FUNCTIONS ---------------------------------------------------- */
  const login = async (username: string, password: string) => {
    await api.post("/users/login/", { username, password });
    const userData = await fetchCurrentUser();
    
    // Safety check: Ensure no stale org context from previous session
    localStorage.removeItem("activeOrgSlug");
    localStorage.removeItem("activeOrgRole");

    if (userData && !userData.is_tutor) {
        router.push("/onboarding");
        return;
    }

    const redirect = sessionStorage.getItem("postLoginRedirect");
    if (redirect) {
      sessionStorage.removeItem("postLoginRedirect");
      router.push(redirect);
    } else {
      router.push("/");
    }
  };

  const logout = async () => {
    try { await api.post("/users/logout/"); } catch {}
    
    // --- CRITICAL FIX: Clear Active Context on Logout ---
    localStorage.removeItem("activeOrgSlug");
    localStorage.removeItem("activeOrgRole");
    // ----------------------------------------------------

    setUser(null);
    router.push("/login");
  };

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
        user, loading, login, logout, register,
        forgotPassword, resetPassword, verifyEmail,
        resendVerification, changePassword, fetchCurrentUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};