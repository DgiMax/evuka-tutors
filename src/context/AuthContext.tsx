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

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                   */
/* -------------------------------------------------------------------------- */

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

interface TutorFormData {
  profileImage: File | null;
  displayName: string;
  headline: string;
  bio: string;
  videoUrl: string;
  subjects: string[];
  education: string;
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
  fetchCurrentUser: () => Promise<void>;
  submitTutorProfile: (formData: TutorFormData) => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                                 CONTEXT                                   */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------------------------------- */
  /*                            FETCH CURRENT USER                              */
  /* -------------------------------------------------------------------------- */
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get<User>("/users/me/");
      setUser(response.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await fetchCurrentUser();
      setLoading(false);
    };
    initializeAuth();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                      HANDLE SESSION EXPIRATION (401)                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      // Save current path so user can resume after login
      sessionStorage.setItem("postLoginRedirect", window.location.pathname);
      router.push("/login?session_expired=true");
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, [router]);

  /* -------------------------------------------------------------------------- */
  /*                           AUTH REDIRECT LOGIC                              */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!loading && !user) {
      const publicRoutes = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ];
      const currentPath = window.location.pathname;

      if (!publicRoutes.some((path) => currentPath.startsWith(path))) {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  /* -------------------------------------------------------------------------- */
  /*                                   LOGIN                                    */
  /* -------------------------------------------------------------------------- */
  const login = async (username: string, password: string) => {
    try {
      await api.post("/users/login/", { username, password });
      await fetchCurrentUser();

      // Redirect user to where they were before session expired
      const redirect = sessionStorage.getItem("postLoginRedirect");
      if (redirect) {
        sessionStorage.removeItem("postLoginRedirect");
        router.push(redirect);
      } else {
        router.push("/");
      }
    } catch (error) {
      throw new Error("Login failed. Please check your credentials.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   LOGOUT                                   */
  /* -------------------------------------------------------------------------- */
  const logout = async () => {
    try {
      await api.post("/users/logout/");
    } catch {
      // ignore network errors
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                AUTH HELPERS                                */
  /* -------------------------------------------------------------------------- */
  const register = async (username: string, email: string, password: string) => {
    await api.post("/users/register/", { username, email, password });
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

  /* -------------------------------------------------------------------------- */
  /*                           SUBMIT TUTOR PROFILE                             */
  /* -------------------------------------------------------------------------- */
  const submitTutorProfile = async (formData: TutorFormData) => {
    const data = new FormData();

    data.append("display_name", formData.displayName);
    data.append("headline", formData.headline);
    data.append("bio", formData.bio);
    data.append("education", formData.education);

    if (formData.videoUrl) data.append("intro_video_url", formData.videoUrl);
    if (formData.profileImage)
      data.append("profile_image", formData.profileImage);

    formData.subjects.forEach((subject) => {
      data.append("subjects", subject);
    });

    await api.post("/users/profile/tutor/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    await fetchCurrentUser();
  };

  /* -------------------------------------------------------------------------- */
  /*                                PROVIDER                                    */
  /* -------------------------------------------------------------------------- */
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
        submitTutorProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   HOOK                                     */
/* -------------------------------------------------------------------------- */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
