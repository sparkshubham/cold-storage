import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { createPlan, deletePlan, listPlans, updatePlan } from '../api/saas';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ListSearch, TablePager } from '../components/ListControls';
import { BusyButton, TableLoading } from '../components/Loading';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { usePagedList } from '../hooks/usePagedList';
import { apiErrorMessage, planSchema, validateForm } from '../validation/schemas';
import type { Plan } from '../types';

const emptyPlan = { name: '', code: '', price: 0, billingCycle: 'monthly', maxUsers: 10, maxChambers: 5, maxStorage: 1000, maxCustomers: 100, description: '' };
type Mode = 'create' | 'edit' | 'view';

export function PlansPage() {
  const queryClient = useQueryClient();
  const list = usePagedList(['plans'], (params) => listPlans(params));
  const [mode, setMode] = useState<Mode>('create');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const readOnly = mode === 'view';

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      const body = { ...payload, billingCycle: form.billingCycle, features: [] };
      return mode === 'edit' && editingId ? updatePlan(editingId, body) : createPlan(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setOpen(false);
      setForm(emptyPlan);
      setErrors({});
      setEditingId(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setDeleteId(null);
    },
  });

  const openRecord = (nextMode: Mode, plan?: Plan) => {
    setMode(nextMode);
    setErrors({});
    if (plan) {
      setEditingId(plan._id);
      setForm({
        name: plan.name,
        code: plan.code,
        price: plan.price,
        billingCycle: plan.billingCycle,
        maxUsers: plan.maxUsers,
        maxChambers: plan.maxChambers,
        maxStorage: plan.maxStorage,
        maxCustomers: plan.maxCustomers,
        description: plan.description ?? '',
      });
    } else {
      setEditingId(null);
      setForm(emptyPlan);
    }
    setOpen(true);
  };

  const submit = () => {
    if (readOnly) return;
    const result = validateForm(planSchema, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    save.mutate(result.data as Record<string, unknown>);
  };

  return (
    <>
      <PageHeader title="Plans" subtitle="SaaS commercial plans used when onboarding a cold storage" actions={<Button variant="contained" onClick={() => openRecord('create')}>Add plan</Button>} />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
      <Paper>
        <TableLoading loading={list.isFetching}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.rows.map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>{plan.code}</TableCell>
                  <TableCell>₹{plan.price.toLocaleString('en-IN')} / {plan.billingCycle}</TableCell>
                  <TableCell>{plan.maxUsers}</TableCell>
                  <TableCell><StatusChip value={plan.isActive ? 'active' : 'inactive'} /></TableCell>
                  <TableCell>
                    <Stack direction="row" gap={1}>
                      <Button size="small" onClick={() => openRecord('view', plan)}>View</Button>
                      <Button size="small" onClick={() => openRecord('edit', plan)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => setDeleteId(plan._id)}>Delete</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableLoading>
        <TablePager total={list.total} page={list.page} rowsPerPage={list.rowsPerPage} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} />
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{mode === 'create' ? 'New plan' : mode === 'edit' ? 'Edit plan' : 'View plan'}</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <TextField label="Name" required disabled={readOnly} value={form.name} error={Boolean(errors.name)} helperText={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Code" required disabled={readOnly} value={form.code} error={Boolean(errors.code)} helperText={errors.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <TextField label="Price" type="number" required disabled={readOnly} value={form.price} error={Boolean(errors.price)} helperText={errors.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <TextField label="Max users" type="number" required disabled={readOnly} value={form.maxUsers} error={Boolean(errors.maxUsers)} helperText={errors.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
            <TextField label="Description" disabled={readOnly} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {save.isError ? <Typography color="error" variant="body2">{apiErrorMessage(save.error, 'Save failed')}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{readOnly ? 'Close' : 'Cancel'}</Button>
          {readOnly ? <Button variant="contained" onClick={() => setMode('edit')}>Edit</Button> : <BusyButton variant="contained" loading={save.isPending} onClick={submit}>{mode === 'edit' ? 'Save' : 'Create'}</BusyButton>}
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete plan" message="Soft-delete this plan?" confirmLabel="Delete" loading={remove.isPending} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} />
    </>
  );
}
