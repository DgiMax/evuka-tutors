// lib/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json", // Default for normal requests
  },
  timeout: 15000, // 15s timeout is good for production
});

// 🧩 Interceptor: Handle FormData uploads cleanly
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"]; // Let browser set correct multipart boundary
  }
  return config;
});

// 🧩 Interceptor: Detect expired sessions globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Trigger an event so AuthContext can handle it
      window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(error);
  }
);

export default api;
