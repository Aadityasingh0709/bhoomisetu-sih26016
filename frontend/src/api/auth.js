import api from "./axios.js";

export const loginRequest = (email, password) =>
  api.post("/auth/login", { email, password }).then((res) => res.data);

export const fetchMe = () => api.get("/auth/me").then((res) => res.data.user);

export const forgotPasswordRequest = (email) =>
  api.post("/auth/forgot-password", { email }).then((res) => res.data);

export const resetPasswordRequest = (token, password, passwordConfirm) =>
  api.post(`/auth/reset-password/${token}`, { password, passwordConfirm }).then((res) => res.data);

export const changePasswordRequest = (currentPassword, newPassword, passwordConfirm) =>
  api.post("/auth/change-password", { currentPassword, newPassword, passwordConfirm }).then((res) => res.data);
