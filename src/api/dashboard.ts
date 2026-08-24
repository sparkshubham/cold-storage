import { api } from './client';
import type { ApiSuccess } from '../types';

export async function getSuperAdminDashboard() {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>('/dashboards/super-admin');
  return data.data;
}

export async function getCompanyDashboard() {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>('/dashboards/company');
  return data.data;
}
