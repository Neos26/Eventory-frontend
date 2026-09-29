import axios from 'axios';

// Single axios instance shared by the whole app.
// No API calls are made yet - this just centralizes config.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export default api;
