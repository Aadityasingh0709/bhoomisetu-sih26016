import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

const api = axios.create({
  baseURL: "/api",
});

// Attach the JWT to every outgoing request
api.interceptors.request.use((config) => {
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
