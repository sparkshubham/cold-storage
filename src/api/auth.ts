import { api } from './client';
import type { ApiSuccess, AuthResponse, AuthUser } from '../types';

export async function login(identifier: string, password: string) {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', { identifier, password });
  return data.data;
}

export async function logout(refreshToken: string) {
  await api.post('/auth/logout', { refreshToken });
}

export async function getMe() {
  const { data } = await api.get<ApiSuccess<AuthUser & { permissions: string[] }>>('/auth/me');
  return data.data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<ApiSuccess<{ delivered: boolean; resetToken?: string }>>('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data;
}
