import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cw_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('Unable to connect to backend. Please ensure the server is running.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const message = data?.message || 'An unexpected error occurred.';

    if (status !== 404) {
      // Don't toast 404s — components handle them
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
