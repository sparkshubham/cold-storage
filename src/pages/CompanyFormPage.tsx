import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Button, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { createCompany, getCompany, updateCompany } from '../api/companies';
import { listPlans } from '../api/saas';
import { PageHeader } from '../components/PageHeader';

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
  const { register, handleSubmit, reset } = useForm<FormValues>({
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
  const { data: existing } = useQuery({
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

  return (
    <>
      <PageHeader title={isEdit ? 'Edit company' : 'Create company'} subtitle="Tenant profile, subscription plan, and first company admin" />
      <Paper sx={{ p: 3, maxWidth: 900 }}>
        {mutation.isError ? <Alert severity="error" sx={{ mb: 2 }}>Save failed. Check unique email and required fields.</Alert> : null}
        <Stack component="form" gap={2} onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Company name" fullWidth required {...register('name')} />
            <TextField label="Legal name" fullWidth {...register('legalName')} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Owner name" fullWidth {...register('ownerName')} />
            <TextField label="Mobile" fullWidth required {...register('mobile')} />
            <TextField label="Email" type="email" fullWidth required {...register('email')} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="GSTIN" fullWidth {...register('gstin')} />
            <TextField label="PAN" fullWidth {...register('pan')} />
            <TextField select label="Plan" fullWidth {...register('planId')}>
              <MenuItem value="">None</MenuItem>
              {(plans?.data ?? []).map((plan) => (
                <MenuItem key={plan._id} value={plan._id}>{plan.name}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField label="Storage capacity" type="number" fullWidth {...register('storageCapacity', { valueAsNumber: true })} />
            <TextField label="Capacity unit" fullWidth {...register('capacityUnit')} />
            <TextField label="Chamber count" type="number" fullWidth {...register('chamberCount', { valueAsNumber: true })} />
          </Stack>
          {!isEdit ? (
            <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
              <TextField label="Admin name" fullWidth required {...register('adminName')} />
              <TextField label="Admin email" type="email" fullWidth required {...register('adminEmail')} />
              <TextField label="Admin password" type="password" fullWidth required {...register('adminPassword')} />
              <TextField label="Admin mobile" fullWidth {...register('adminMobile')} />
            </Stack>
          ) : null}
          <Stack direction="row" gap={2}>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save'}</Button>
            <Button onClick={() => navigate('/super-admin/companies')}>Cancel</Button>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
