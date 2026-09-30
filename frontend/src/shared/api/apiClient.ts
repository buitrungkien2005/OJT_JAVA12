import axios, { AxiosError } from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT if available
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}

// Response interceptor: on 401 clear token and redirect to login, normalize error
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ status?: number; message?: string; errors?: Record<string, string> }>) => {
    if (error.response?.status === 401) {
      tokenStorage.removeToken();
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }

    const normalizedError: ApiError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      errors: error.response?.data?.errors,
    };

    return Promise.reject(normalizedError);
  }
);
