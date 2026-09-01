import { api } from './client';
import type { ApiSuccess } from '../types';

export type UnitRate = {
  unit: string;
  storageRatePerUnitPerDay: number;
  inwardHandlingRate: number;
  outwardHandlingRate: number;
};

export type CompanySettings = {
  _id?: string;
  invoicePrefix: string;
  defaultGstRate: number;
  storageRatePerUnitPerDay: number;
  inwardHandlingRate: number;
  outwardHandlingRate: number;
  unitRates: UnitRate[];
};

export async function getSettings() {
  const { data } = await api.get<ApiSuccess<CompanySettings>>('/settings');
  return data.data;
}

export async function updateSettings(payload: Partial<CompanySettings>) {
  const { data } = await api.patch<ApiSuccess<CompanySettings>>('/settings', payload);
  return data.data;
}
