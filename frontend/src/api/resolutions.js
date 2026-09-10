import api from "./axios.js";

export const fetchResolutions = (params = {}) =>
  api.get("/resolutions", { params }).then((res) => res.data);

export const fetchResolutionById = (id) =>
  api.get(`/resolutions/${id}`).then((res) => res.data);

export const createResolution = (payload) =>
  api.post("/resolutions", payload).then((res) => res.data);

export const deleteResolution = (id) =>
  api.delete(`/resolutions/${id}`).then((res) => res.data);
