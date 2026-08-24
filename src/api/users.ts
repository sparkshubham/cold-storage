import { api } from './client';
import type { ApiSuccess, AppUser, AuditLog, Paginated } from '../types';

export async function listUsers(params: Record<string, string | number | undefined> = {}) {
  const { data } = await api.get<Paginated<AppUser>>('/users', { params });
  return data;
}

export async function createUser(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<AppUser>>('/users', payload);
  return data;
}

export async function updateUser(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch<ApiSuccess<AppUser>>(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

export async function listRoles(companyId?: string) {
  const { data } = await api.get<ApiSuccess<Array<{ _id: string; name: string; code: string }>>>('/roles', {
    params: companyId ? { companyId } : undefined,
  });
  return data.data;
}

export async function listAuditLogs(params: Record<string, string | number | undefined> = {}) {
  const { data } = await api.get<Paginated<AuditLog>>('/audit-logs', { params });
  return data;
}
