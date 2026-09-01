import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { createPlan, deletePlan, listPlans } from '../api/saas';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ListSearch, TablePager } from '../components/ListControls';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { usePagedList } from '../hooks/usePagedList';
import { apiErrorMessage, planSchema, validateForm } from '../validation/schemas';

const emptyPlan = { name: '', code: '', price: 0, billingCycle: 'monthly', maxUsers: 10, maxChambers: 5, maxStorage: 1000, maxCustomers: 100, description: '' };

export function PlansPage() {
  const queryClient = useQueryClient();
  const list = usePagedList(['plans'], (params) => listPlans(params));
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createPlan({ ...payload, billingCycle: form.billingCycle, features: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setOpen(false);
      setForm(emptyPlan);
      setErrors({});
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setDeleteId(null);
    },
  });

  const submit = () => {
    const result = validateForm(planSchema, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    create.mutate(result.data as Record<string, unknown>);
  };

  return (
    <>
      <PageHeader title="Plans" subtitle="SaaS commercial plans used when onboarding a cold storage" actions={<Button variant="contained" onClick={() => { setForm(emptyPlan); setErrors({}); setOpen(true); }}>Add plan</Button>} />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
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
                <TableCell><Button color="error" onClick={() => setDeleteId(plan._id)}>Delete</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePager total={list.total} page={list.page} rowsPerPage={list.rowsPerPage} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} />
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New plan</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <TextField label="Name" required value={form.name} error={Boolean(errors.name)} helperText={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Code" required value={form.code} error={Boolean(errors.code)} helperText={errors.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <TextField label="Price" type="number" required value={form.price} error={Boolean(errors.price)} helperText={errors.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <TextField label="Max users" type="number" required value={form.maxUsers} error={Boolean(errors.maxUsers)} helperText={errors.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {create.isError ? <Typography color="error" variant="body2">{apiErrorMessage(create.error, 'Create failed')}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={create.isPending}>Create</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete plan" message="Soft-delete this plan?" confirmLabel="Delete" onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} />
    </>
  );
}
