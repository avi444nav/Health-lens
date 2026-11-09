import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getPatients = () => api.get("/patients");
export const getPatientProfile = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post("/patients", data);
export const getPatientReports = (patientId) => api.get(`/patients/${patientId}/reports`);

export const uploadReport = (patientId, formData) => {
  return api.post(`/patients/${patientId}/reports/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getComparison = (patientId) => api.get(`/patients/${patientId}/comparison`);
export const getLongitudinal = (patientId) => api.get(`/patients/${patientId}/longitudinal`);
export const getPredictions = (patientId) => api.get(`/patients/${patientId}/predictions`);
export const getLifestyle = (patientId) => api.get(`/patients/${patientId}/lifestyle`);
export const getChatHistory = (patientId) => api.get(`/patients/${patientId}/chats`);
export const queryRag = (patientId, query) => api.post("/rag/query", { patient_id: patientId, query });
export const resetDemoData = () => api.post("/seed/reset");

export default api;
