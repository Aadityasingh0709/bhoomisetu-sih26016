import api from "./axios.js";

export const fetchDashboardSummary = () =>
  api.get("/dashboard/summary").then((res) => res.data);

export const fetchMapData = () => api.get("/dashboard/map").then((res) => res.data);
