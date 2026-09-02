import api from "./axios.js";

export const loginRequest = (email, password) =>
  api.post("/auth/login", { email, password }).then((res) => res.data);

export const fetchMe = () => api.get("/auth/me").then((res) => res.data.user);
