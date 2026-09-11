import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

const api = axios.create({
  // In dev, Vite proxies /api → localhost:5000 (no env var needed).
  // In production, set VITE_API_URL=https://your-backend.railway.app in the
  // hosting platform's environment variables so requests reach the real server.
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

// Attach the JWT to every outgoing request
api.interceptors.request.use((config) => {
  // Read token fresh on each request (not at module load time)
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Log the user out automatically if the token is rejected
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
