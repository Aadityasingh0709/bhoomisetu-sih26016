import api from "./axios.js";
import { fetchDepartments } from "./departments.js";
export { fetchDepartments };

export const fetchProjects = (params = {}) =>
  api.get("/projects", { params }).then((res) => res.data);

export const fetchProject = (id) => api.get(`/projects/${id}`).then((res) => res.data);

export const createProject = (payload) =>
  api.post("/projects", payload).then((res) => res.data);

export const updateDepartmentProgress = (projectId, deptId, payload) =>
  api
    .patch(`/projects/${projectId}/departments/${deptId}`, payload)
    .then((res) => res.data);

export const deleteProject = (id) =>
  api.delete(`/projects/${id}`).then((res) => res.data);

export const addProjectResolution = (projectId, payload) =>
  api.post(`/projects/${projectId}/resolutions`, payload).then((res) => res.data);

export const deleteProjectResolution = (projectId, resolutionId) =>
  api.delete(`/projects/${projectId}/resolutions/${resolutionId}`).then((res) => res.data);
