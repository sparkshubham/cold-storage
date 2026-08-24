import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const ACCESS_KEY = 'coldflow_access_token';
const REFRESH_KEY = 'coldflow_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  const payload = data.data as { accessToken: string; refreshToken: string };
  setTokens(payload.accessToken, payload.refreshToken);
  return payload.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = refreshAccessToken().finally(() => {
            refreshing = null;
          });
        }
        const token = await refreshing;
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      } catch {
        clearTokens();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);
