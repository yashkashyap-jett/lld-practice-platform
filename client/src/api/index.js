import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Session identity: browser-persisted UUID, sent as header on every request
// This gives each browser session a "personal" history without authentication
const getSessionId = () => {
  let sessionId = localStorage.getItem('lld_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('lld_session_id', sessionId);
  }
  return sessionId;
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach session ID to every request
api.interceptors.request.use((config) => {
  config.headers['X-Session-ID'] = getSessionId();
  return config;
});

// Unwrap { success, data } envelope
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'An unexpected error occurred';
    const error = new Error(message);
    error.statusCode = err.response?.status;
    error.fields = err.response?.data?.fields;
    return Promise.reject(error);
  }
);

// ─── Problems ─────────────────────────────────────────────────────────────────
export const getProblems = () => api.get('/problems').then((r) => r.data);
export const getProblem = (id) => api.get(`/problems/${id}`).then((r) => r.data);

// ─── Attempts ─────────────────────────────────────────────────────────────────
export const createAttempt = (problemId, previousAttemptId = null) =>
  api.post('/attempts', { problemId, previousAttemptId }).then((r) => r.data);

export const getAttempts = () => api.get('/attempts').then((r) => r.data);

export const getAttempt = (id) => api.get(`/attempts/${id}`).then((r) => r.data);

export const submitAttempt = (id, submissionData) =>
  api.post(`/attempts/${id}/submit`, submissionData).then((r) => r.data);

export const triggerEvaluation = (id) =>
  api.post(`/attempts/${id}/evaluate`).then((r) => r.data);

export const getEvaluation = (id) =>
  api.get(`/attempts/${id}/evaluation`).then((r) => r.data);
