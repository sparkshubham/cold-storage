import { api } from './client';
import type { ApiSuccess, Company, Paginated } from '../types';

export async function listCompanies(params: Record<string, string | number | undefined>) {
  const { data } = await api.get<Paginated<Company>>('/companies', { params });
  return data;
}

export async function getCompany(id: string) {
  const { data } = await api.get<ApiSuccess<{ company: Company; userCount: number; admin: unknown }>>(`/companies/${id}`);
  return data.data;
}

export async function createCompany(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<Company>>('/companies', payload);
  return data;
}

export async function updateCompany(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch<ApiSuccess<Company>>(`/companies/${id}`, payload);
  return data;
}

export async function suspendCompany(id: string) {
  const { data } = await api.post(`/companies/${id}/suspend`);
  return data;
}

export async function activateCompany(id: string) {
  const { data } = await api.post(`/companies/${id}/activate`);
  return data;
}

export async function deleteCompany(id: string) {
  const { data } = await api.delete(`/companies/${id}`);
  return data;
}
