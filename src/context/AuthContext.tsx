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

declare module "axios" {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

interface Organization {
  organization_name: string;
  organization_slug: string;
  organization_status: string;
  is_published: boolean;
  role?: string;
  is_active?: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  is_tutor?: boolean;
  is_student?: boolean;
  is_publisher?: boolean;
  organizations?: Organization[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, origin?: string) => Promise<void>;
  forgotPassword: (email: string, origin?: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string, origin?: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  fetchCurrentUser: (skipRefresh?: boolean) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
            setUser(null);
            localStorage.removeItem("activeOrgSlug"); 
            localStorage.removeItem("activeOrgRole");
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const fetchCurrentUser = useCallback(async (skipRefresh = false) => {
    try {
      const response = await api.get<User>("/users/me/");
      setUser(response.data);
      return response.data;
    } catch {
      return null;
    }
  }, []);

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

  useEffect(() => {
    if (loading) return; 

    const path = pathname || "/";
    const isOnboardingRoute = path.startsWith("/onboarding");
    
    const publicRoutes = [
      "/login", "/register", "/forgot-password", 
      "/verify-email", "/reset-password", "/check-email", "/auth/google"
    ];
    const isPublicRoute = publicRoutes.some(r => path === r || path.startsWith(`${r}/`));

    if (!user) {
      if (!isPublicRoute && !isOnboardingRoute) { 
        sessionStorage.setItem("postLoginRedirect", path);
        router.replace("/login");
      }
      return;
    }

    if (!user.is_tutor) {
      if (!isOnboardingRoute) {
        router.replace("/onboarding");
      }
      return;
    }

    if (user.is_tutor) {
      if (isPublicRoute || isOnboardingRoute) {
        router.replace("/");
      }
    }

  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string) => {
    await api.post("/users/login/", { username, password });
    const userData = await fetchCurrentUser();
    
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
    
    localStorage.removeItem("activeOrgSlug");
    localStorage.removeItem("activeOrgRole");
    
    setUser(null);
    router.push("/login");
  };

  const register = async (username: string, email: string, password: string, origin?: string) => {
    const data = { username, email, password, origin: origin || window.location.origin };
    await api.post("/users/register/", data);
    router.push("/check-email");
  };

  const forgotPassword = async (email: string, origin?: string) => {
    const data = { email, origin: origin || window.location.origin };
    await api.post("/users/forgot-password/", data);
  };

  const resetPassword = async (token: string, password: string) => {
    await api.post(`/users/reset-password/${token}/`, { password });
  };

  const verifyEmail = async (token: string) => {
    await api.post("/users/verify-email/", { token });
  };

  const resendVerification = async (email: string, origin?: string) => {
    const data = { email, origin: origin || window.location.origin };
    await api.post("/users/resend-verification/", data);
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