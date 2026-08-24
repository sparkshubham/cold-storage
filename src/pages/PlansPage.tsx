import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { createPlan, deletePlan, listPlans } from '../api/saas';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader, StatusChip } from '../components/PageHeader';

export function PlansPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['plans'], queryFn: () => listPlans({ limit: 50 }) });
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', price: 0, billingCycle: 'monthly', maxUsers: 10, maxChambers: 5, maxStorage: 1000, maxCustomers: 100, description: '' });

  const create = useMutation({
    mutationFn: () => createPlan({ ...form, price: Number(form.price), features: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setDeleteId(null);
    },
  });

  return (
    <>
      <PageHeader title="Plans" subtitle="SaaS commercial plans used when onboarding a cold storage" actions={<Button variant="contained" onClick={() => setOpen(true)}>Add plan</Button>} />
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
            {(data?.data ?? []).map((plan) => (
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
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New plan</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <TextField label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <TextField label="Max users" type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => create.mutate()}>Create</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete plan" message="Soft-delete this plan?" confirmLabel="Delete" onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} />
    </>
  );
}
