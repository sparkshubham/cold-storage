import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ZodType } from 'zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { createResource, deleteResource, getResource, listResource, updateResource } from '../api/resources';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ListSearch, TablePager } from '../components/ListControls';
import { BusyButton, TableLoading } from '../components/Loading';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { usePagedList } from '../hooks/usePagedList';
import { apiErrorMessage, validateForm } from '../validation/schemas';

export type CrudField = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'textarea';
  required?: boolean;
  defaultValue?: string | number;
  endpoint?: string;
  dependsOn?: string;
  dependParam?: string;
};

export type CrudColumn = {
  key: string;
  label: string;
};

type Mode = 'create' | 'edit' | 'view';

function cellValue(row: Record<string, unknown>, key: string) {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object') return (current as Record<string, unknown>)[part];
    return undefined;
  }, row);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return String(obj.name ?? obj.code ?? obj._id ?? '');
  }
  if (value == null || value === '') return '—';
  return String(value);
}

function optionLabel(row: Record<string, unknown>) {
  if (row.name && row.code) return `${row.code} — ${row.name}`;
  return String(row.name ?? row.code ?? row._id ?? '');
}

function formFromDoc(doc: Record<string, unknown>, fields: CrudField[], defaults: Record<string, string | number>) {
  const next = { ...defaults };
  for (const field of fields) {
    const value = doc[field.name];
    if (value && typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
      next[field.name] = String((value as Record<string, unknown>)._id);
    } else if (field.type === 'number') {
      next[field.name] = Number(value ?? field.defaultValue ?? 0);
    } else if (value != null) {
      next[field.name] = String(value);
    }
  }
  return next;
}

function ResourceSelect({
  field,
  form,
  error,
  disabled,
  onChange,
}: {
  field: CrudField;
  form: Record<string, string | number>;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const parentValue = field.dependsOn ? String(form[field.dependsOn] ?? '') : '';
  const { data } = useQuery({
    queryKey: ['options', field.endpoint, parentValue],
    queryFn: () =>
      listResource(field.endpoint!, {
        limit: 100,
        ...(field.dependsOn ? { [field.dependParam ?? field.dependsOn]: parentValue } : {}),
      }),
    enabled: Boolean(field.endpoint) && (!field.dependsOn || Boolean(parentValue)),
  });

  return (
    <TextField
      select
      label={field.label}
      value={form[field.name] ?? ''}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
      disabled={disabled || (Boolean(field.dependsOn) && !parentValue)}
      error={Boolean(error)}
      helperText={error}
    >
      {(data?.data ?? []).map((row) => {
        const item = row as Record<string, unknown>;
        return (
          <MenuItem key={String(item._id)} value={String(item._id)}>
            {optionLabel(item)}
          </MenuItem>
        );
      })}
    </TextField>
  );
}

export function CrudPage({
  title,
  subtitle,
  endpoint,
  queryKey,
  columns,
  fields,
  schema,
  createPermission,
  updatePermission,
  deletePermission,
}: {
  title: string;
  subtitle: string;
  endpoint: string;
  queryKey: string;
  columns: CrudColumn[];
  fields: CrudField[];
  schema: ZodType<unknown>;
  createPermission: string;
  updatePermission: string;
  deletePermission: string;
}) {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const defaults = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [field.name, field.defaultValue ?? (field.type === 'number' ? 0 : '')]),
      ) as Record<string, string | number>,
    [fields],
  );
  const [mode, setMode] = useState<Mode>('create');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const list = usePagedList([queryKey], (params) => listResource(endpoint, params));
  const readOnly = mode === 'view';

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      mode === 'edit' && editingId ? updateResource(endpoint, editingId, payload) : createResource(endpoint, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setOpen(false);
      setEditingId(null);
      setForm(defaults);
      setErrors({});
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteResource(endpoint, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setDeleteId(null);
    },
  });

  const setField = (name: string, value: string | number) => {
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      fields.forEach((field) => {
        if (field.dependsOn === name) next[field.name] = '';
      });
      return next;
    });
  };

  const openCreate = () => {
    setMode('create');
    setEditingId(null);
    setForm(defaults);
    setErrors({});
    setOpen(true);
  };

  const openRecord = async (nextMode: 'view' | 'edit', row: Record<string, unknown>) => {
    const id = String(row._id);
    setMode(nextMode);
    setEditingId(id);
    setForm(formFromDoc(row, fields, defaults));
    setErrors({});
    setOpen(true);
    try {
      const result = await getResource<Record<string, unknown>>(`${endpoint}/${id}`);
      const doc = (result.data ?? result) as Record<string, unknown>;
      setForm(formFromDoc(doc, fields, defaults));
    } catch {
      /* list row is enough to edit */
    }
  };

  const submit = () => {
    if (readOnly) return;
    const result = validateForm(schema, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    save.mutate(result.data as Record<string, unknown>);
  };

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          hasPermission(createPermission) ? (
            <Button variant="contained" onClick={openCreate}>
              Add
            </Button>
          ) : undefined
        }
      />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
      <Paper>
        <TableLoading loading={list.isFetching}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.label}</TableCell>
                ))}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!list.isFetching && list.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Typography color="text.secondary">No records yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                list.rows.map((row) => {
                  const item = row as Record<string, unknown>;
                  return (
                    <TableRow key={String(item._id)}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.key === 'status' ? <StatusChip value={cellValue(item, column.key)} /> : cellValue(item, column.key)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                          <Button size="small" onClick={() => void openRecord('view', item)}>View</Button>
                          {hasPermission(updatePermission) ? (
                            <Button size="small" onClick={() => void openRecord('edit', item)}>Edit</Button>
                          ) : null}
                          {hasPermission(deletePermission) ? (
                            <Button size="small" color="error" onClick={() => setDeleteId(String(item._id))}>
                              Delete
                            </Button>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableLoading>
        <TablePager
          total={list.total}
          page={list.page}
          rowsPerPage={list.rowsPerPage}
          onPageChange={list.onPageChange}
          onRowsPerPageChange={list.onRowsPerPageChange}
        />
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{mode === 'create' ? 'New record' : mode === 'edit' ? 'Edit record' : 'View record'}</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1} component="form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            {fields.map((field) =>
              field.type === 'select' ? (
                <ResourceSelect
                  key={field.name}
                  field={field}
                  form={form}
                  error={errors[field.name]}
                  disabled={readOnly}
                  onChange={(value) => setField(field.name, value)}
                />
              ) : (
                <TextField
                  key={field.name}
                  label={field.label}
                  type={field.type === 'number' ? 'number' : 'text'}
                  multiline={field.type === 'textarea'}
                  minRows={field.type === 'textarea' ? 3 : undefined}
                  required={field.required}
                  value={form[field.name] ?? ''}
                  disabled={readOnly}
                  error={Boolean(errors[field.name])}
                  helperText={errors[field.name]}
                  onChange={(e) => setField(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                />
              ),
            )}
            {save.isError ? (
              <Typography color="error" variant="body2">
                {apiErrorMessage(save.error, 'Save failed')}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{readOnly ? 'Close' : 'Cancel'}</Button>
          {readOnly && hasPermission(updatePermission) ? (
            <Button variant="contained" onClick={() => setMode('edit')}>Edit</Button>
          ) : null}
          {!readOnly ? (
            <BusyButton variant="contained" loading={save.isPending} onClick={submit}>
              {mode === 'edit' ? 'Save' : 'Create'}
            </BusyButton>
          ) : null}
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete record"
        message="Soft-delete this record?"
        confirmLabel="Delete"
        loading={remove.isPending}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </>
  );
}
