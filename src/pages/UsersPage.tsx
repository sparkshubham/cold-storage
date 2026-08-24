import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { createUser, deleteUser, listRoles, listUsers } from '../api/users';
import { listCompanies } from '../api/companies';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

export function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuper = user?.role === 'super_admin';
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', roleId: '', companyId: '' });
  const companyId = useMemo(() => (isSuper ? form.companyId || undefined : user?.companyId ?? undefined), [form.companyId, isSuper, user]);
  const { data } = useQuery({ queryKey: ['users'], queryFn: () => listUsers({ limit: 50 }) });
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: () => listCompanies({ limit: 100 }), enabled: isSuper });
  const { data: roles } = useQuery({ queryKey: ['roles', companyId], queryFn: () => listRoles(companyId) });

  const create = useMutation({
    mutationFn: () => createUser({ ...form, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
    },
  });

  return (
    <>
      <PageHeader title="Users" subtitle={isSuper ? 'Platform and tenant users' : 'Users in your company'} actions={<Button variant="contained" onClick={() => setOpen(true)}>Add user</Button>} />
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.data ?? []).map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.roleCode}</TableCell>
                <TableCell><StatusChip value={item.status} /></TableCell>
                <TableCell><Button color="error" onClick={() => setDeleteId(item._id)}>Delete</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>New user</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <TextField label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {isSuper ? (
              <TextField select label="Company" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value, roleId: '' })}>
                {(companies?.data ?? []).map((company) => (
                  <MenuItem key={company._id} value={company._id}>{company.name}</MenuItem>
                ))}
              </TextField>
            ) : null}
            <TextField select label="Role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              {(roles ?? []).map((role) => (
                <MenuItem key={role._id} value={role._id}>{role.name}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => create.mutate()}>Create</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete user" message="Soft-delete this user?" confirmLabel="Delete" onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} />
    </>
  );
}
