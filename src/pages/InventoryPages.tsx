import { useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { cancelResource, createResource, listResource } from '../api/resources';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GenerateBillDialog } from '../components/GenerateBillDialog';
import { ListSearch, TablePager } from '../components/ListControls';
import { BusyButton, TableLoading } from '../components/Loading';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { usePagedList } from '../hooks/usePagedList';
import {
  adjustmentSchema,
  apiErrorMessage,
  inwardOutwardSchema,
  openingStockSchema,
  validateForm,
} from '../validation/schemas';

type Row = Record<string, unknown>;

function labelOf(value: unknown) {
  if (value && typeof value === 'object') {
    const obj = value as Row;
    return String(obj.name ?? obj.code ?? '');
  }
  return value == null ? '—' : String(value);
}

function invoiceIdOf(value: unknown) {
  if (value && typeof value === 'object' && '_id' in (value as Row)) return String((value as Row)._id);
  return value ? String(value) : '';
}

function StorageFields({
  form,
  setForm,
  errors,
}: {
  form: Record<string, string | number>;
  setForm: Dispatch<SetStateAction<Record<string, string | number>>>;
  errors: Record<string, string>;
}) {
  const { data: customers } = useQuery({ queryKey: ['customers', 'options'], queryFn: () => listResource('/customers', { limit: 100 }) });
  const { data: products } = useQuery({ queryKey: ['products', 'options'], queryFn: () => listResource('/products', { limit: 100 }) });
  const { data: chambers } = useQuery({ queryKey: ['chambers', 'options'], queryFn: () => listResource('/chambers', { limit: 100 }) });
  const { data: racks } = useQuery({
    queryKey: ['racks', 'options', form.chamberId],
    queryFn: () => listResource('/racks', { limit: 100, chamberId: String(form.chamberId) }),
    enabled: Boolean(form.chamberId),
  });
  const { data: locations } = useQuery({
    queryKey: ['locations', 'options', form.rackId],
    queryFn: () => listResource('/locations', { limit: 100, rackId: String(form.rackId) }),
    enabled: Boolean(form.rackId),
  });

  const set = (patch: Record<string, string | number>) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <Stack gap={2} mt={1}>
      <TextField select required label="Customer" value={form.customerId} error={Boolean(errors.customerId)} helperText={errors.customerId} onChange={(e) => set({ customerId: e.target.value })}>
        {(customers?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{labelOf(item)}</MenuItem>;
        })}
      </TextField>
      <TextField select required label="Product" value={form.productId} error={Boolean(errors.productId)} helperText={errors.productId} onChange={(e) => set({ productId: e.target.value })}>
        {(products?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{labelOf(item)}</MenuItem>;
        })}
      </TextField>
      <TextField
        select
        required
        label="Chamber"
        value={form.chamberId}
        error={Boolean(errors.chamberId)}
        helperText={errors.chamberId}
        onChange={(e) => set({ chamberId: e.target.value, rackId: '', locationId: '' })}
      >
        {(chambers?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{labelOf(item)}</MenuItem>;
        })}
      </TextField>
      <TextField
        select
        required
        label="Rack"
        value={form.rackId}
        disabled={!form.chamberId}
        error={Boolean(errors.rackId)}
        helperText={errors.rackId}
        onChange={(e) => set({ rackId: e.target.value, locationId: '' })}
      >
        {(racks?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{labelOf(item)}</MenuItem>;
        })}
      </TextField>
      <TextField select required label="Location" value={form.locationId} disabled={!form.rackId} error={Boolean(errors.locationId)} helperText={errors.locationId} onChange={(e) => set({ locationId: e.target.value })}>
        {(locations?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{String(item.code ?? item._id)}</MenuItem>;
        })}
      </TextField>
      <TextField required label="Quantity" type="number" value={form.quantity} error={Boolean(errors.quantity)} helperText={errors.quantity} onChange={(e) => set({ quantity: Number(e.target.value) })} />
      <TextField required label="Unit" value={form.unit} error={Boolean(errors.unit)} helperText={errors.unit} onChange={(e) => set({ unit: e.target.value })} />
      <TextField label="Batch number" value={form.batchNumber} onChange={(e) => set({ batchNumber: e.target.value })} />
      <TextField label="Notes" value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
    </Stack>
  );
}

const emptyForm = {
  customerId: '',
  productId: '',
  chamberId: '',
  rackId: '',
  locationId: '',
  quantity: 0,
  unit: 'MT',
  batchNumber: '',
  notes: '',
};

export function InventoryPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'opening' | 'adjustment' | null>(null);
  const [form, setForm] = useState<Record<string, string | number>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const list = usePagedList(['inventory'], (params) => listResource('/inventory', params));
  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createResource(mode === 'opening' ? '/inventory/opening' : '/inventory/adjustments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      setMode(null);
      setForm(emptyForm);
      setErrors({});
    },
  });

  const submit = () => {
    const schema = mode === 'opening' ? openingStockSchema : adjustmentSchema;
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
        title="Inventory"
        subtitle="Live stock by customer, product, and location. Every quantity change writes a stock transaction."
        actions={
          hasPermission('inventory.adjust') ? (
            <Stack direction="row" gap={1}>
              <Button variant="contained" onClick={() => { setErrors({}); setForm(emptyForm); setMode('opening'); }}>Opening stock</Button>
              <Button variant="outlined" onClick={() => { setErrors({}); setForm(emptyForm); setMode('adjustment'); }}>Adjustment</Button>
            </Stack>
          ) : undefined
        }
      />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
      <Paper>
        <TableLoading loading={list.isFetching}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!list.isFetching && list.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}><Typography color="text.secondary">No stock rows yet.</Typography></TableCell>
                </TableRow>
              ) : list.rows.map((row) => {
                const item = row as Row;
                return (
                  <TableRow key={String(item._id)}>
                    <TableCell>{labelOf(item.customerId)}</TableCell>
                    <TableCell>{labelOf(item.productId)}</TableCell>
                    <TableCell>{labelOf(item.locationId)}</TableCell>
                    <TableCell>{String(item.quantity ?? 0)}</TableCell>
                    <TableCell>{String(item.unit ?? '')}</TableCell>
                    <TableCell><StatusChip value={String(item.status ?? '')} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableLoading>
        <TablePager total={list.total} page={list.page} rowsPerPage={list.rowsPerPage} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} />
      </Paper>
      <Dialog open={Boolean(mode)} onClose={() => setMode(null)} fullWidth maxWidth="sm">
        <DialogTitle>{mode === 'opening' ? 'Opening stock' : 'Stock adjustment'}</DialogTitle>
        <DialogContent>
          <StorageFields form={form} setForm={setForm} errors={errors} />
          {mode === 'adjustment' ? (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Use a negative quantity to reduce stock.
            </Typography>
          ) : null}
          {save.isError ? (
            <Typography color="error" variant="body2" mt={1}>
              {apiErrorMessage(save.error, 'Save failed')}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMode(null)}>Cancel</Button>
          <BusyButton variant="contained" loading={save.isPending} onClick={submit}>Save</BusyButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function StockMovementPage({ kind }: { kind: 'inward' | 'outward' }) {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [billId, setBillId] = useState('');
  const [cancelId, setCancelId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Record<string, string | number>>({ ...emptyForm, vehicleNumber: '' });
  const path = kind === 'inward' ? '/inwards' : '/outwards';
  const listPath = kind === 'inward' ? '/app/inwards' : '/app/outwards';
  const list = usePagedList([kind], (params) => listResource(path, params));
  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createResource(path, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [kind] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      setOpen(false);
      setForm({ ...emptyForm, vehicleNumber: '' });
      setErrors({});
    },
  });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelResource(path, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [kind] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      setCancelId('');
    },
  });
  const canCreate = hasPermission(kind === 'inward' ? 'inward.create' : 'outward.create');
  const canUpdate = hasPermission(kind === 'inward' ? 'inward.update' : 'outward.update');
  const canCancel = hasPermission(kind === 'inward' ? 'inward.cancel' : 'outward.cancel');
  const canBill = hasPermission('invoice.create');
  const canViewBill = hasPermission('invoice.view');

  const submit = () => {
    const result = validateForm(inwardOutwardSchema, form);
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
        title={kind === 'inward' ? 'Inwards' : 'Outwards'}
        subtitle={kind === 'inward' ? 'Goods received into chambers. Open a slip to view, edit notes, or generate a bill.' : 'Goods issued from chambers. Generate the storage bill from the outward slip.'}
        actions={canCreate ? <Button variant="contained" onClick={() => { setErrors({}); setForm({ ...emptyForm, vehicleNumber: '' }); setOpen(true); }}>Create</Button> : undefined}
      />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
      <Paper>
        <TableLoading loading={list.isFetching}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Bill</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="no-print">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!list.isFetching && list.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}><Typography color="text.secondary">No {kind} slips yet.</Typography></TableCell>
                </TableRow>
              ) : list.rows.map((row) => {
                const item = row as Row;
                const id = String(item._id);
                const invoice = item.invoiceId as Row | string | null | undefined;
                const invoiceId = invoiceIdOf(invoice);
                const invoiceNumber = invoice && typeof invoice === 'object' ? String(invoice.invoiceNumber ?? '') : '';
                const cancelled = String(item.status ?? '') === 'cancelled';
                return (
                  <TableRow key={id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`${listPath}/${id}`)}>
                    <TableCell>{String(item.inwardNumber ?? item.outwardNumber ?? '')}</TableCell>
                    <TableCell>{labelOf(item.customerId)}</TableCell>
                    <TableCell>{labelOf(item.productId)}</TableCell>
                    <TableCell>{String(item.quantity ?? 0)} {String(item.unit ?? '')}</TableCell>
                    <TableCell>{labelOf(item.locationId)}</TableCell>
                    <TableCell>{invoiceNumber || (invoiceId ? 'Billed' : '—')}</TableCell>
                    <TableCell><StatusChip value={String(item.status ?? '')} /></TableCell>
                    <TableCell className="no-print" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        <Button size="small" onClick={() => navigate(`${listPath}/${id}`)}>View</Button>
                        {canUpdate && !cancelled ? <Button size="small" onClick={() => navigate(`${listPath}/${id}`)}>Edit</Button> : null}
                        {invoiceId && canViewBill ? (
                          <Button size="small" onClick={() => navigate(`/app/invoices/${invoiceId}`)}>Bill</Button>
                        ) : !cancelled && canBill ? (
                          <Button size="small" variant="outlined" onClick={() => setBillId(id)}>Generate bill</Button>
                        ) : null}
                        {canCancel && !cancelled && !invoiceId ? (
                          <Button size="small" color="error" onClick={() => setCancelId(id)}>Cancel</Button>
                        ) : null}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableLoading>
        <TablePager total={list.total} page={list.page} rowsPerPage={list.rowsPerPage} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} />
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{kind === 'inward' ? 'New inward' : 'New outward'}</DialogTitle>
        <DialogContent>
          <StorageFields form={form} setForm={setForm} errors={errors} />
          <TextField
            sx={{ mt: 2 }}
            fullWidth
            label="Vehicle number"
            value={form.vehicleNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
          />
          {save.isError ? (
            <Typography color="error" variant="body2" mt={1}>
              {apiErrorMessage(save.error, 'Save failed')}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <BusyButton variant="contained" loading={save.isPending} onClick={submit}>Save</BusyButton>
        </DialogActions>
      </Dialog>
      <GenerateBillDialog sourceType={kind} sourceId={billId} open={Boolean(billId)} onClose={() => setBillId('')} />
      <ConfirmDialog
        open={Boolean(cancelId)}
        title={`Cancel ${kind}`}
        message="This reverses the stock movement. Quantity on the slip cannot be edited after it is posted."
        confirmLabel="Cancel slip"
        loading={cancel.isPending}
        onClose={() => setCancelId('')}
        onConfirm={() => cancelId && cancel.mutate(cancelId)}
      />
    </>
  );
}

export function StockLedgerPage() {
  const list = usePagedList(['stock-transactions'], (params) => listResource('/stock-transactions', params));
  return (
    <>
      <PageHeader title="Stock ledger" subtitle="Immutable stock transactions. Inventory is never edited without a row here." />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
      <Paper>
        <TableLoading loading={list.isFetching}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!list.isFetching && list.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}><Typography color="text.secondary">No stock transactions yet.</Typography></TableCell>
                </TableRow>
              ) : list.rows.map((row) => {
                const item = row as Row;
                return (
                  <TableRow key={String(item._id)}>
                    <TableCell>{item.createdAt ? new Date(String(item.createdAt)).toLocaleString('en-IN') : '—'}</TableCell>
                    <TableCell>{String(item.type ?? '')}</TableCell>
                    <TableCell>{labelOf(item.customerId)}</TableCell>
                    <TableCell>{labelOf(item.productId)}</TableCell>
                    <TableCell>{String(item.quantity ?? 0)} {String(item.unit ?? '')}</TableCell>
                    <TableCell>{String(item.referenceNumber || item.referenceType || '—')}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableLoading>
        <TablePager total={list.total} page={list.page} rowsPerPage={list.rowsPerPage} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} />
      </Paper>
    </>
  );
}
