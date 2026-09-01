import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { createUser, deleteUser, listRoles, listUsers } from '../api/users';
import { listCompanies } from '../api/companies';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ListSearch, TablePager } from '../components/ListControls';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { usePagedList } from '../hooks/usePagedList';
import { apiErrorMessage, userCreateSchema, validateForm } from '../validation/schemas';

const emptyUser = { name: '', email: '', mobile: '', password: '', roleId: '', companyId: '' };

export function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuper = user?.role === 'super_admin';
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyUser);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const companyId = useMemo(() => (isSuper ? form.companyId || undefined : user?.companyId ?? undefined), [form.companyId, isSuper, user]);
  const list = usePagedList(['users'], (params) => listUsers(params));
  const { data: companies } = useQuery({ queryKey: ['companies', 'options'], queryFn: () => listCompanies({ limit: 100 }), enabled: isSuper });
  const { data: roles } = useQuery({ queryKey: ['roles', companyId], queryFn: () => listRoles(companyId) });

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setForm(emptyUser);
      setErrors({});
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
    },
  });

  const submit = () => {
    const result = validateForm(userCreateSchema, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (isSuper && !form.companyId) {
      setErrors({ companyId: 'Select a company' });
      return;
    }
    setErrors({});
    create.mutate({ ...result.data, companyId });
  };

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={isSuper ? 'Platform and tenant users' : 'Users in your company'}
        actions={<Button variant="contained" onClick={() => { setForm(emptyUser); setErrors({}); setOpen(true); }}>Add user</Button>}
      />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
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
            {list.rows.map((item) => (
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
        <TablePager total={list.total} page={list.page} rowsPerPage={list.rowsPerPage} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} />
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>New user</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <TextField label="Name" required value={form.name} error={Boolean(errors.name)} helperText={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Email" required value={form.email} error={Boolean(errors.email)} helperText={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Mobile" value={form.mobile} error={Boolean(errors.mobile)} helperText={errors.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <TextField label="Password" type="password" required value={form.password} error={Boolean(errors.password)} helperText={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {isSuper ? (
              <TextField select required label="Company" value={form.companyId} error={Boolean(errors.companyId)} helperText={errors.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value, roleId: '' })}>
                {(companies?.data ?? []).map((company) => (
                  <MenuItem key={company._id} value={company._id}>{company.name}</MenuItem>
                ))}
              </TextField>
            ) : null}
            <TextField select required label="Role" value={form.roleId} error={Boolean(errors.roleId)} helperText={errors.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              {(roles ?? []).map((role) => (
                <MenuItem key={role._id} value={role._id}>{role.name}</MenuItem>
              ))}
            </TextField>
            {create.isError ? <Typography color="error" variant="body2">{apiErrorMessage(create.error, 'Create failed')}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={create.isPending}>Create</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete user" message="Soft-delete this user?" confirmLabel="Delete" onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} />
    </>
  );
}
