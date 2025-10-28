import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json", // keep default JSON for normal requests
  },
});

// 🧩 Interceptor: Automatically handle FormData uploads
api.interceptors.request.use((config) => {
  // If the request contains FormData, remove the JSON Content-Type
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export default api;
