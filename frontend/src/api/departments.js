import api from "./axios.js";

export const fetchDepartments = () => api.get("/departments").then((res) => res.data);
