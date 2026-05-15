import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, user, setTokens, logout } = useAuthStore.getState();
      if (refreshToken && user) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, {
            userId: user.id,
            refreshToken,
          });
          const { tokens } = res.data.data ?? res.data;
          setTokens(tokens.accessToken, tokens.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return apiClient(originalRequest);
        } catch {
          logout();
          window.location.href = '/login';
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
