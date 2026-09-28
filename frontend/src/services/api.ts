import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
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
