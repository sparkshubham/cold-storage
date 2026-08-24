import { api } from './client';
import type { ApiSuccess, Plan, Paginated, Subscription } from '../types';

export async function listPlans(params: Record<string, string | number | undefined> = {}) {
  const { data } = await api.get<Paginated<Plan>>('/plans', { params });
  return data;
}

export async function createPlan(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<Plan>>('/plans', payload);
  return data;
}

export async function updatePlan(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch<ApiSuccess<Plan>>(`/plans/${id}`, payload);
  return data;
}

export async function deletePlan(id: string) {
  const { data } = await api.delete(`/plans/${id}`);
  return data;
}

export async function listSubscriptions(params: Record<string, string | number | undefined> = {}) {
  const { data } = await api.get<Paginated<Subscription>>('/subscriptions', { params });
  return data;
}

export async function updateSubscriptionStatus(id: string, status: string) {
  const { data } = await api.patch(`/subscriptions/${id}/status`, { status });
  return data;
}
