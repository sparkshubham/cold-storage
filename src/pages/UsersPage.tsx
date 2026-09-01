import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { createUser, deleteUser, listRoles, listUsers, updateUser } from '../api/users';
import { listCompanies } from '../api/companies';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ListSearch, TablePager } from '../components/ListControls';
import { BusyButton, TableLoading } from '../components/Loading';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { usePagedList } from '../hooks/usePagedList';
import { apiErrorMessage, userCreateSchema, userUpdateSchema, validateForm } from '../validation/schemas';
import type { AppUser } from '../types';

const emptyUser = { name: '', email: '', mobile: '', password: '', roleId: '', companyId: '' };
type Mode = 'create' | 'edit' | 'view';

function roleIdOf(user: AppUser) {
  const role = user.roleId;
  if (role && typeof role === 'object' && '_id' in role) return String((role as { _id: string })._id);
  return typeof role === 'string' ? role : '';
}

function companyIdOf(user: AppUser) {
  const company = user.companyId;
  if (company && typeof company === 'object' && '_id' in company) return String(company._id);
  return typeof company === 'string' ? company : '';
}

export function UsersPage() {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const isSuper = user?.role === 'super_admin';
  const [mode, setMode] = useState<Mode>('create');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyUser);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const companyId = useMemo(() => (isSuper ? form.companyId || undefined : user?.companyId ?? undefined), [form.companyId, isSuper, user]);
  const list = usePagedList(['users'], (params) => listUsers(params));
  const { data: companies } = useQuery({ queryKey: ['companies', 'options'], queryFn: () => listCompanies({ limit: 100 }), enabled: isSuper });
  const { data: roles } = useQuery({ queryKey: ['roles', companyId], queryFn: () => listRoles(companyId) });
  const readOnly = mode === 'view';

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      mode === 'edit' && editingId ? updateUser(editingId, payload) : createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setForm(emptyUser);
      setErrors({});
      setEditingId(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
    },
  });

  const openRecord = (nextMode: Mode, item?: AppUser) => {
    setMode(nextMode);
    setErrors({});
    if (item) {
      setEditingId(item._id);
      setForm({
        name: item.name,
        email: item.email,
        mobile: item.mobile ?? '',
        password: '',
        roleId: roleIdOf(item),
        companyId: companyIdOf(item),
      });
    } else {
      setEditingId(null);
      setForm(emptyUser);
    }
    setOpen(true);
  };

  const submit = () => {
    if (readOnly) return;
    const schema = mode === 'edit' ? userUpdateSchema : userCreateSchema;
    const result = validateForm(schema, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (isSuper && !form.companyId) {
      setErrors({ companyId: 'Select a company' });
      return;
    }
    const payload = { ...result.data, companyId };
    if (mode === 'edit' && !form.password) delete (payload as { password?: string }).password;
    setErrors({});
    save.mutate(payload);
  };

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={isSuper ? 'Platform and tenant users' : 'Users in your company'}
        actions={hasPermission('user.create') ? <Button variant="contained" onClick={() => openRecord('create')}>Add user</Button> : undefined}
      />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
      <Paper>
        <TableLoading loading={list.isFetching}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.rows.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.roleCode}</TableCell>
                  <TableCell><StatusChip value={item.status} /></TableCell>
                  <TableCell>
                    <Stack direction="row" gap={1}>
                      <Button size="small" onClick={() => openRecord('view', item)}>View</Button>
                      {hasPermission('user.update') ? <Button size="small" onClick={() => openRecord('edit', item)}>Edit</Button> : null}
                      {hasPermission('user.delete') ? <Button size="small" color="error" onClick={() => setDeleteId(item._id)}>Delete</Button> : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableLoading>
        <TablePager total={list.total} page={list.page} rowsPerPage={list.rowsPerPage} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} />
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{mode === 'create' ? 'New user' : mode === 'edit' ? 'Edit user' : 'View user'}</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <TextField label="Name" required disabled={readOnly} value={form.name} error={Boolean(errors.name)} helperText={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Email" required disabled={readOnly} value={form.email} error={Boolean(errors.email)} helperText={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Mobile" disabled={readOnly} value={form.mobile} error={Boolean(errors.mobile)} helperText={errors.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <TextField
              label={mode === 'edit' ? 'Password (leave blank to keep)' : 'Password'}
              type="password"
              required={mode === 'create'}
              disabled={readOnly}
              value={form.password}
              error={Boolean(errors.password)}
              helperText={errors.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {isSuper ? (
              <TextField select required disabled={readOnly} label="Company" value={form.companyId} error={Boolean(errors.companyId)} helperText={errors.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value, roleId: '' })}>
                {(companies?.data ?? []).map((company) => (
                  <MenuItem key={company._id} value={company._id}>{company.name}</MenuItem>
                ))}
              </TextField>
            ) : null}
            <TextField select required disabled={readOnly} label="Role" value={form.roleId} error={Boolean(errors.roleId)} helperText={errors.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              {(roles ?? []).map((role) => (
                <MenuItem key={role._id} value={role._id}>{role.name}</MenuItem>
              ))}
            </TextField>
            {save.isError ? <Typography color="error" variant="body2">{apiErrorMessage(save.error, 'Save failed')}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{readOnly ? 'Close' : 'Cancel'}</Button>
          {readOnly && hasPermission('user.update') ? <Button variant="contained" onClick={() => setMode('edit')}>Edit</Button> : null}
          {!readOnly ? <BusyButton variant="contained" loading={save.isPending} onClick={submit}>{mode === 'edit' ? 'Save' : 'Create'}</BusyButton> : null}
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete user" message="Soft-delete this user?" confirmLabel="Delete" loading={remove.isPending} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} />
    </>
  );
}
