import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Button, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { createCompany, getCompany, updateCompany } from '../api/companies';
import { listPlans } from '../api/saas';
import { BusyButton, PageSpinner } from '../components/Loading';
import { PageHeader } from '../components/PageHeader';
import { apiErrorMessage, companyCreateSchema, companyUpdateSchema } from '../validation/schemas';

interface FormValues {
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
  planId: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminMobile: string;
}

export function CompanyFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'new';
  const navigate = useNavigate();
  const schema = useMemo(() => (isEdit ? companyUpdateSchema : companyCreateSchema), [isEdit]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: '',
      legalName: '',
      ownerName: '',
      mobile: '',
      email: '',
      gstin: '',
      pan: '',
      storageCapacity: 0,
      capacityUnit: 'MT',
      chamberCount: 0,
      planId: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      adminMobile: '',
    },
  });
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: () => listPlans({ limit: 50 }) });
  const { data: existing, isPending: loadingCompany } = useQuery({
    queryKey: ['company', id],
    queryFn: () => getCompany(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    const company = existing?.company;
    if (!company) return;
    reset({
      name: company.name,
      legalName: company.legalName ?? '',
      ownerName: company.ownerName ?? '',
      mobile: company.mobile,
      email: company.email,
      gstin: company.gstin ?? '',
      pan: company.pan ?? '',
      storageCapacity: company.storageCapacity,
      capacityUnit: company.capacityUnit,
      chamberCount: company.chamberCount,
      planId: typeof company.planId === 'object' && company.planId ? company.planId._id : String(company.planId ?? ''),
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      adminMobile: '',
    });
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        storageCapacity: Number(values.storageCapacity),
        chamberCount: Number(values.chamberCount),
        planId: values.planId || undefined,
      };
      return isEdit ? updateCompany(id!, payload) : createCompany(payload);
    },
    onSuccess: () => navigate('/super-admin/companies'),
  });

  if (isEdit && loadingCompany && !existing) {
    return <PageSpinner />;
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Edit company' : 'Create company'} subtitle="Tenant profile, subscription plan, and first company admin" />
      <Paper sx={{ p: 3, maxWidth: 900 }}>
        {mutation.isError ? <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(mutation.error, 'Save failed. Check unique email and required fields.')}</Alert> : null}
        <Stack component="form" gap={2} onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Company name" fullWidth required error={Boolean(errors.name)} helperText={errors.name?.message} {...register('name')} />
            <TextField label="Legal name" fullWidth {...register('legalName')} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Owner name" fullWidth {...register('ownerName')} />
            <TextField label="Mobile" fullWidth required error={Boolean(errors.mobile)} helperText={errors.mobile?.message} {...register('mobile')} />
            <TextField label="Email" type="email" fullWidth required error={Boolean(errors.email)} helperText={errors.email?.message} {...register('email')} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="GSTIN" fullWidth error={Boolean(errors.gstin)} helperText={errors.gstin?.message} {...register('gstin')} />
            <TextField label="PAN" fullWidth error={Boolean(errors.pan)} helperText={errors.pan?.message} {...register('pan')} />
            <TextField select label="Plan" fullWidth {...register('planId')}>
              <MenuItem value="">None</MenuItem>
              {(plans?.data ?? []).map((plan) => (
                <MenuItem key={plan._id} value={plan._id}>{plan.name}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Storage capacity" type="number" fullWidth error={Boolean(errors.storageCapacity)} helperText={errors.storageCapacity?.message} {...register('storageCapacity', { valueAsNumber: true })} />
            <TextField label="Capacity unit" fullWidth {...register('capacityUnit')} />
            <TextField label="Chamber count" type="number" fullWidth error={Boolean(errors.chamberCount)} helperText={errors.chamberCount?.message} {...register('chamberCount', { valueAsNumber: true })} />
          </Stack>
          {!isEdit ? (
            <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
              <TextField label="Admin name" fullWidth required error={Boolean(errors.adminName)} helperText={errors.adminName?.message} {...register('adminName')} />
              <TextField label="Admin email" type="email" fullWidth required error={Boolean(errors.adminEmail)} helperText={errors.adminEmail?.message} {...register('adminEmail')} />
              <TextField label="Admin password" type="password" fullWidth required error={Boolean(errors.adminPassword)} helperText={errors.adminPassword?.message} {...register('adminPassword')} />
              <TextField label="Admin mobile" fullWidth {...register('adminMobile')} />
            </Stack>
          ) : null}
          <Stack direction="row" gap={2}>
            <BusyButton type="submit" variant="contained" loading={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save'}</BusyButton>
            <Button onClick={() => navigate('/super-admin/companies')}>Cancel</Button>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
