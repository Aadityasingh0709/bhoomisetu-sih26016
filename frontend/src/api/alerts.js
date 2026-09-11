import api from "./axios.js";

export const fetchAlerts = (params = {}) =>
  api.get("/alerts", { params }).then((res) => res.data);

/**
 * Report / create a new bottleneck alert.
 */
export const createAlert = (payload) =>
  api.post("/alerts", payload).then((res) => res.data);

/**
 * Higher authority posts a corrective-action decision on an alert.
 * @param {string} id   - Alert _id
 * @param {string} decision - Decision text from the authority
 */
export const postAlertDecision = (id, decision) =>
  api.patch(`/alerts/${id}/decision`, { decision }).then((res) => res.data);

/**
 * Department officer marks the bottleneck as physically fixed
 * after acting on the authority's decision.
 * @param {string} id   - Alert _id
 * @param {string} note - Optional short note from the officer
 */
export const officerMarkAlertResolved = (id, note = "") =>
  api.patch(`/alerts/${id}/officer-resolved`, { note }).then((res) => res.data);

/**
 * Higher authority fully closes / resolves an alert.
 */
export const resolveAlert = (id, payload = {}) =>
  api.patch(`/alerts/${id}/resolve`, payload).then((res) => res.data);
