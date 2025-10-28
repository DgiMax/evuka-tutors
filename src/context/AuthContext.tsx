// contexts/AuthContext.tsx

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/axios";

// --- Interfaces (Updated) ---
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
  is_superadmin: boolean;
  is_moderator: boolean;
  is_tutor?: boolean;   // <-- This is the flag we're changing
  is_student?: boolean;
  organizations?: Organization[];
}

// This is the FormData type from your TutorOnboardingForm
// You may need to export it from that file and import it here
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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<any>;
  loading: boolean;
  fetchCurrentUser: () => Promise<void>;
  // --- NEW FUNCTION ADDED ---
  submitTutorProfile: (formData: TutorFormData) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get<User>("/users/me/");
      setUser(response.data);
    } catch (err) {
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

  useEffect(() => {
    if (!loading) {
      // If user is not logged in, redirect to login
      if (!user) {
        const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
        const currentPath = window.location.pathname;

        // Only redirect if not already on a public route
        if (!publicRoutes.some((path) => currentPath.startsWith(path))) {
          router.push("/login");
        }
      }
    }
  }, [user, loading]);


  const login = async (username: string, password: string) => {
    await api.post("/users/login/", { username, password });
    await fetchCurrentUser();
    router.push("/");
  };

  const logout = async () => {
    try {
      await api.post("/users/logout/");
    } catch (error) {
      console.error("Logout request to backend failed:", error);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  const register = (username: string, email: string, password: string) => {
    return api.post("/users/register/", { username, email, password });
  };

  const forgotPassword = (email: string) => {
    return api.post("/users/forgot-password/", { email });
  };

  const resetPassword = (token: string, password: string) => {
    return api.post(`/users/reset-password/${token}/`, { password });
  };

  const verifyEmail = (token: string) => {
    return api.post("/users/verify-email/", { token });
  };

  const resendVerification = (email: string) => {
    return api.post("/users/resend-verification/", { email });
  };

  const changePassword = (oldPassword: string, newPassword: string) => {
    return api.post("/users/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
    });
  };

  // --- NEW FUNCTION IMPLEMENTATION ---
  const submitTutorProfile = async (formData: TutorFormData) => {
    // We must use FormData because we are sending a file (profileImage)
    const data = new FormData();
    
    // Map the React state names to the Django serializer names
    data.append('display_name', formData.displayName);
    data.append('headline', formData.headline);
    data.append('bio', formData.bio);
    data.append('education', formData.education);
    
    if (formData.videoUrl) {
      data.append('intro_video_url', formData.videoUrl);
    }
    if (formData.profileImage) {
      data.append('profile_image', formData.profileImage);
    }
    
    // Append each subject to the 'subjects' key
    formData.subjects.forEach(subject => {
      data.append('subjects', subject);
    });

    // Make the API call
    const response = await api.post('/users/profile/tutor/', data, {
      headers: {
        // This header is crucial for file uploads
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // --- CRITICAL STEP ---
    // After successful submission, the user's 'is_tutor' flag
    // has changed on the backend. We must re-fetch the user
    // to update the app's state.
    await fetchCurrentUser();
    
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        changePassword,
        loading,
        fetchCurrentUser,
        submitTutorProfile, // <-- Add new function to provider value
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};