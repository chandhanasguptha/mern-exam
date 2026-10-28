import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor to extract data cleanly and format errors
api.interceptors.response.use(
  response => response.data,
  error => {
    const errorResponse = error.response?.data || {
      success: false,
      message: error.message || 'An unexpected network error occurred.',
      data: null
    };
    return Promise.reject(errorResponse);
  }
);

export const applicationService = {
  getApplications: (params = {}) => api.get('/applications', { params }),
  getApplication: (id) => api.get(`/applications/${id}`),
  createApplication: (payload) => api.post('/applications', payload),
  updateApplication: (id, payload) => api.put(`/applications/${id}`, payload),
  updateStatus: (id, status, notes = '') => api.patch(`/applications/${id}/status`, { status, notes }),
  deleteApplication: (id) => api.delete(`/applications/${id}`),
  getStats: () => api.get('/applications/stats'),
  checkHealth: () => api.get('/health')
};

export default api;
