export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  companyId: string | null;
  status: string;
  permissions?: string[];
  company?: { id: string; name: string; status: string; logoUrl?: string } | null;
}

export interface AuthResponse {
  user: AuthUser;
  permissions: string[];
  accessToken: string;
  refreshToken: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Paginated<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

export interface Plan {
  _id: string;
  name: string;
  code: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  maxUsers: number;
  maxChambers: number;
  maxStorage: number;
  maxCustomers: number;
  features: string[];
  description: string;
  isActive: boolean;
}

export interface Company {
  _id: string;
  name: string;
  legalName: string;
  ownerName: string;
  mobile: string;
  email: string;
  gstin: string;
  pan: string;
  storageCapacity: number;
  capacityUnit: string;
  chamberCount: number;
  status: string;
  planId?: Plan | string | null;
  subscriptionId?: { status: string; startDate: string; endDate: string } | string | null;
  createdAt: string;
}

export interface AppUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  roleCode: string;
  status: string;
  lastLoginAt?: string | null;
  companyId?: { _id: string; name: string } | string | null;
  roleId?: { name: string; code: string } | string;
}

export interface AuditLog {
  _id: string;
  userName: string;
  action: string;
  module: string;
  recordLabel: string;
  ip: string;
  createdAt: string;
}

export interface Subscription {
  _id: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  companyId?: { name: string; email: string; status: string } | string;
  planId?: { name: string; code: string; price: number } | string;
}
