// contexts/AuthContext.tsx
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
  fetchCurrentUser: () => Promise<User | null>; 
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

        // If 401 → Try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await api.post("/users/refresh/"); // this uses cookies
            return api(originalRequest); // retry the failed request
          } catch {
            // Refresh failed → Logout
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

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get<User>("/users/me/");
      setUser(response.data);
      return response.data; // Returns User
    } catch {
      setUser(null);
      return null; // Returns null
    }
  };

  useEffect(() => {
    const init = async () => {
      // NOTE: We don't await/use the return value here, but the function signature is now correct.
      await fetchCurrentUser(); 
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
    
    // '/onboarding' is NOT in publicRoutes.

    const isPublicRoute = publicRoutes.some((route) =>
      path.startsWith(route)
    );
    
    const isOnboardingRoute = path.startsWith("/onboarding");

    // --- 1. UNAUTHENTICATED REDIRECT ---
    if (!user) {
        // If the user is not logged in AND they are not on a public route, redirect to login.
        if (!isPublicRoute) {
            // Save the current path to redirect back after login
            sessionStorage.setItem("postLoginRedirect", path);
            router.replace("/login");
        }
        return; // Stop further checks if user is null
    }

    // --- 2. AUTHENTICATED REDIRECTS ---
    
    // a) Redirect users away from public routes once they log in
    if (user && isPublicRoute) {
        router.replace("/");
        return;
    }

    // b) Redirect new users who haven't selected a role/profile to /onboarding
    if (user && !user.is_tutor && !user.is_student && !isOnboardingRoute) {
        router.replace("/onboarding");
    }
    
  }, [user, loading, router]);

  /* LOGIN ------------------------------------------------------------- */

  const login = async (username: string, password: string) => {
    try {
      await api.post("/users/login/", { username, password });

      // Fetch latest user data and set state
      const currentUserData = await fetchCurrentUser();

      const redirect = sessionStorage.getItem("postLoginRedirect");

      // Check 2: Redirect to saved path or home
      if (redirect) {
        sessionStorage.removeItem("postLoginRedirect");
        router.push(redirect);
      } else {
        router.push("/");
      }
    } catch {
      throw new Error("Login failed. Please check your credentials.");
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
    // Redirect to a page that tells the user to check their email
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