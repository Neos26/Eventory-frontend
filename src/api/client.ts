import axios from 'axios';
import { clearToken, getToken } from './tokenStorage';

// Single axios instance shared by the whole app.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach the JWT to every request when one is stored.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid token (any 401 except the login attempt itself) means
// the session is over: drop it and land on the login page.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url ?? '';
      const isLogin = url.includes('/auth/login');
      if (status === 401 && !isLogin && getToken()) {
        clearToken();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
