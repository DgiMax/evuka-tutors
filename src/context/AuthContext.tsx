"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* TOKEN AUTO-REFRESH LOGIC ----------------------------------------- */

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (originalRequest._skipAuthRefresh) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await api.post("/users/refresh/");
            return api(originalRequest);
          } catch {
            setUser(null);
            router.push("/login?session_expired=true");
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [router]);

  /* FETCH CURRENT USER ------------------------------------------------ */

  const fetchCurrentUser = async (skipRefresh = false) => {
    try {
      const response = await api.get<User>("/users/me/", {
        _skipAuthRefresh: skipRefresh,
      });
      setUser(response.data);
      return response.data;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser(true);
      setLoading(false);
    };
    init();
  }, []);

  /* AUTH REDIRECT LOGIC ---------------------------------------------- */

  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname;

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
      if (path.startsWith(`${route}/`)) return true;
      return false;
    });

    const isOnboardingRoute = path.startsWith("/onboarding");

    if (!user) {
      if (!isPublicRoute) {
        sessionStorage.setItem("postLoginRedirect", path);
        router.replace("/login");
      }
      return;
    }

    if (user && isPublicRoute) {
      router.replace("/");
      return;
    }

    if (user && !user.is_tutor && !user.is_student && !isOnboardingRoute) {
      router.replace("/onboarding");
    }
  }, [user, loading, router]);

  /* LOGIN ------------------------------------------------------------- */

  const login = async (username: string, password: string) => {
    try {
      await api.post("/users/login/", { username, password });
      await fetchCurrentUser(false);

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

  if (loading) {
    return null;
  }

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
      {children}
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
