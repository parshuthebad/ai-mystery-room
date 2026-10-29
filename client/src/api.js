import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', timeout: 90000 });

export const errMsg = (e) =>
  e.response?.data?.error || (e.code === 'ECONNABORTED' ? 'The request timed out. Try again.' : 'Cannot reach the server. Check your connection and try again.');
