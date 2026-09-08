import api from "./axios.js";

export const fetchAlerts = (params = {}) =>
  api.get("/alerts", { params }).then((res) => res.data);

export const resolveAlert = (id) => api.patch(`/alerts/${id}/resolve`).then((res) => res.data);
