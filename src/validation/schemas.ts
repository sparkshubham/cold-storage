import { z, type ZodError, type ZodType } from 'zod';

export function fieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function validateForm<T>(schema: ZodType<T>, values: unknown): { ok: true; data: T } | { ok: false; errors: Record<string, string> } {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, errors: fieldErrors(result.error) };
}

export function apiErrorMessage(err: unknown, fallback = 'Request failed') {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

const optionalText = z.string().optional().default('');
const optionalEmail = z
  .string()
  .trim()
  .email('Enter a valid email')
  .or(z.literal(''))
  .optional()
  .default('');
const gstin = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN')
  .or(z.literal(''))
  .optional()
  .default('');
const pan = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN')
  .or(z.literal(''))
  .optional()
  .default('');

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Email or mobile is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  businessName: optionalText,
  mobile: z.string().trim().min(10, 'Mobile must be 10–15 digits').max(15, 'Mobile must be 10–15 digits'),
  email: optionalEmail,
  city: optionalText,
  state: optionalText,
  gstin,
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  mobile: z.string().trim().min(10, 'Mobile must be 10–15 digits').max(15, 'Mobile must be 10–15 digits'),
  email: optionalEmail,
  gstin,
  address: optionalText,
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  description: optionalText,
});

export const unitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z.string().trim().min(1, 'Code is required'),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  categoryId: optionalText,
  unitId: optionalText,
  hsn: optionalText,
  storageType: optionalText,
  defaultRate: z.coerce.number().min(0, 'Rate cannot be negative'),
});

export const chamberSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  code: optionalText,
  capacity: z.coerce.number().positive('Capacity must be greater than 0'),
  temperature: z.coerce.number().optional(),
  location: optionalText,
});

export const rackSchema = z.object({
  chamberId: z.string().min(1, 'Select a chamber'),
  name: z.string().trim().min(1, 'Name is required'),
  code: optionalText,
  capacity: z.coerce.number().positive('Capacity must be greater than 0'),
});

export const locationSchema = z.object({
  chamberId: z.string().min(1, 'Select a chamber'),
  rackId: z.string().min(1, 'Select a rack'),
  section: optionalText,
  capacity: z.coerce.number().positive('Capacity must be greater than 0'),
});

const movementBase = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  productId: z.string().min(1, 'Select a product'),
  chamberId: z.string().min(1, 'Select a chamber'),
  rackId: z.string().min(1, 'Select a rack'),
  locationId: z.string().min(1, 'Select a location'),
  unit: z.string().trim().min(1, 'Unit is required'),
  batchNumber: optionalText,
  notes: optionalText,
  vehicleNumber: optionalText,
});

export const openingStockSchema = movementBase.extend({
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
});

export const adjustmentSchema = movementBase.extend({
  quantity: z.coerce.number().refine((value) => value !== 0, 'Quantity cannot be zero'),
});

export const inwardOutwardSchema = movementBase.extend({
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
});

export const billRatesSchema = z.object({
  storageRatePerUnitPerDay: z.coerce.number().min(0, 'Rate cannot be negative'),
  inwardHandlingRate: z.coerce.number().min(0, 'Rate cannot be negative'),
  outwardHandlingRate: z.coerce.number().min(0, 'Rate cannot be negative'),
  gstRate: z.coerce.number().min(0, 'GST cannot be negative').max(100, 'GST cannot exceed 100%'),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  mobile: z.union([z.literal(''), z.string().trim().min(10, 'Mobile must be 10–15 digits').max(15)]),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().min(1, 'Select a role'),
  companyId: z.string().optional().default(''),
});

export const planSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  code: z.string().trim().min(2, 'Code is required'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  maxUsers: z.coerce.number().int().min(1, 'At least 1 user'),
  description: optionalText,
});

const companyFields = {
  name: z.string().trim().min(2, 'Company name is required'),
  legalName: optionalText,
  ownerName: optionalText,
  mobile: z.string().trim().min(10, 'Mobile must be 10–15 digits').max(15),
  email: z.string().trim().email('Enter a valid email'),
  gstin,
  pan,
  storageCapacity: z.coerce.number().min(0, 'Capacity cannot be negative'),
  capacityUnit: z.string().trim().min(1, 'Unit is required'),
  chamberCount: z.coerce.number().int().min(0, 'Cannot be negative'),
  planId: optionalText,
};

export const companyCreateSchema = z.object({
  ...companyFields,
  adminName: z.string().trim().min(2, 'Admin name is required'),
  adminEmail: z.string().trim().email('Enter a valid admin email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminMobile: optionalText,
});

export const companyUpdateSchema = z.object(companyFields);
