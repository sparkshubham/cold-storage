import { api } from './client';
import type { ApiSuccess, Paginated } from '../types';

export async function listResource<T = Record<string, unknown>>(path: string, params: Record<string, string | number | undefined> = {}) {
  const { data } = await api.get<Paginated<T>>(path, { params });
  return data;
}

export async function getResource<T = Record<string, unknown>>(path: string, params: Record<string, string | number | undefined> = {}) {
  const { data } = await api.get<ApiSuccess<T>>(path, { params });
  return data;
}

export async function createResource<T = Record<string, unknown>>(path: string, payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<T>>(path, payload);
  return data;
}

export async function updateResource<T = Record<string, unknown>>(path: string, id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch<ApiSuccess<T>>(`${path}/${id}`, payload);
  return data;
}

export async function deleteResource(path: string, id: string) {
  const { data } = await api.delete(`${path}/${id}`);
  return data;
}
