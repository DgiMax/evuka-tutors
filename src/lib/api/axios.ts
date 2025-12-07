// lib/api/axios.ts
import axios from "axios";

// Create the instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.e-vuka.com",
  withCredentials: true, // Important: Sends cookies (Refresh Token)
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// 🧩 Interceptor 1: Request Helper
// Cleans up headers for file uploads
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Variables to handle concurrent requests during refresh
let isRefreshing = false;
let failedQueue: any[] = [];

// Helper to process the queue of failed requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 🧩 Interceptor 2: Automatic Token Refresh & Retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Prevent infinite loops
      if (originalRequest.url.includes("/users/refresh/")) {
        // If the refresh endpoint itself fails, logout the user
        window.dispatchEvent(new Event("auth-expired"));
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // When resolved, retry the original request
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        // 1. Attempt to refresh the token
        // We use 'axios' directly here to avoid using our interceptors
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "https://api.e-vuka.com"}/users/refresh/`,
          {},
          { withCredentials: true }
        );

        // 2. If successful, process the queue
        processQueue(null); 
        
        // 3. Retry the original failing request
        return api(originalRequest);

      } catch (refreshError) {
        // 4. If refresh fails, kill the session
        processQueue(refreshError, null);
        window.dispatchEvent(new Event("auth-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;