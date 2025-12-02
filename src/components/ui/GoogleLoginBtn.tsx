"use client";

import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function GoogleLoginBtn() {
  const { fetchCurrentUser } = useAuth();
  const router = useRouter();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }

      // 1. Send the token to your Django Backend
      await api.post("/users/auth/google/", {
        token: credentialResponse.credential,
      });

      // 2. Refresh Auth Context (Cookies are set by backend now)
      await fetchCurrentUser();
      
      toast.success("Logged in with Google!");
      router.push("/dashboard"); 
      
    } catch (error: any) {
      console.error("Google Login Error:", error);
      const msg = error.response?.data?.detail || "Google login failed.";
      toast.error(msg);
    }
  };

  const handleError = () => {
    toast.error("Google Login Failed to initialize.");
  };

  return (
    <div className="w-full flex justify-center mb-6">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="outline" 
        size="large"
        width="100%" 
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}