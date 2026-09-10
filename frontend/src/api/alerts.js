import api from "./axios.js";

export const fetchAlerts = (params = {}) =>
  api.get("/alerts", { params }).then((res) => res.data);

export const resolveAlert = (id, payload = {}) =>
  api.patch(`/alerts/${id}/resolve`, payload).then((res) => res.data);
