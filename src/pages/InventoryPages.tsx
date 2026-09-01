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
import { createResource, listResource } from '../api/resources';
import { GenerateBillDialog } from '../components/GenerateBillDialog';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

type Row = Record<string, unknown>;

function labelOf(value: unknown) {
  if (value && typeof value === 'object') {
    const obj = value as Row;
    return String(obj.name ?? obj.code ?? '');
  }
  return value == null ? '—' : String(value);
}

function StorageFields({
  form,
  setForm,
}: {
  form: Record<string, string | number>;
  setForm: Dispatch<SetStateAction<Record<string, string | number>>>;
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

  return (
    <Stack gap={2} mt={1}>
      <TextField select label="Customer" value={form.customerId} onChange={(e) => setForm((prev) => ({ ...prev, customerId: e.target.value }))}>
        {(customers?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{labelOf(item)}</MenuItem>;
        })}
      </TextField>
      <TextField select label="Product" value={form.productId} onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}>
        {(products?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{labelOf(item)}</MenuItem>;
        })}
      </TextField>
      <TextField
        select
        label="Chamber"
        value={form.chamberId}
        onChange={(e) => setForm((prev) => ({ ...prev, chamberId: e.target.value, rackId: '', locationId: '' }))}
      >
        {(chambers?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{labelOf(item)}</MenuItem>;
        })}
      </TextField>
      <TextField
        select
        label="Rack"
        value={form.rackId}
        disabled={!form.chamberId}
        onChange={(e) => setForm((prev) => ({ ...prev, rackId: e.target.value, locationId: '' }))}
      >
        {(racks?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{labelOf(item)}</MenuItem>;
        })}
      </TextField>
      <TextField select label="Location" value={form.locationId} disabled={!form.rackId} onChange={(e) => setForm((prev) => ({ ...prev, locationId: e.target.value }))}>
        {(locations?.data ?? []).map((row) => {
          const item = row as Row;
          return <MenuItem key={String(item._id)} value={String(item._id)}>{String(item.code ?? item._id)}</MenuItem>;
        })}
      </TextField>
      <TextField label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} />
      <TextField label="Unit" value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} />
      <TextField label="Batch number" value={form.batchNumber} onChange={(e) => setForm((prev) => ({ ...prev, batchNumber: e.target.value }))} />
      <TextField label="Notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
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
  const { data } = useQuery({ queryKey: ['inventory'], queryFn: () => listResource('/inventory', { limit: 50 }) });
  const save = useMutation({
    mutationFn: () =>
      createResource(mode === 'opening' ? '/inventory/opening' : '/inventory/adjustments', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      setMode(null);
      setForm(emptyForm);
    },
  });

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Live stock by customer, product, and location. Every quantity change writes a stock transaction."
        actions={
          hasPermission('inventory.adjust') ? (
            <Stack direction="row" gap={1}>
              <Button variant="contained" onClick={() => setMode('opening')}>Opening stock</Button>
              <Button variant="outlined" onClick={() => setMode('adjustment')}>Adjustment</Button>
            </Stack>
          ) : undefined
        }
      />
      <Paper>
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
            {(data?.data ?? []).map((row) => {
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
      </Paper>
      <Dialog open={Boolean(mode)} onClose={() => setMode(null)} fullWidth maxWidth="sm">
        <DialogTitle>{mode === 'opening' ? 'Opening stock' : 'Stock adjustment'}</DialogTitle>
        <DialogContent>
          <StorageFields form={form} setForm={setForm} />
          {mode === 'adjustment' ? (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Use a negative quantity to reduce stock.
            </Typography>
          ) : null}
          {save.isError ? (
            <Typography color="error" variant="body2" mt={1}>
              {(save.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed'}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMode(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
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
  const [form, setForm] = useState<Record<string, string | number>>({ ...emptyForm, vehicleNumber: '' });
  const path = kind === 'inward' ? '/inwards' : '/outwards';
  const listPath = kind === 'inward' ? '/app/inwards' : '/app/outwards';
  const { data } = useQuery({ queryKey: [kind], queryFn: () => listResource(path, { limit: 50 }) });
  const save = useMutation({
    mutationFn: () => createResource(path, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [kind] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      setOpen(false);
      setForm({ ...emptyForm, vehicleNumber: '' });
    },
  });
  const canCreate = hasPermission(kind === 'inward' ? 'inward.create' : 'outward.create');
  const canBill = hasPermission('invoice.create');
  const canViewBill = hasPermission('invoice.view');

  return (
    <>
      <PageHeader
        title={kind === 'inward' ? 'Inwards' : 'Outwards'}
        subtitle={kind === 'inward' ? 'Goods received into chambers. Open a slip to view or generate a bill.' : 'Goods issued from chambers. Generate the storage bill from the outward slip.'}
        actions={canCreate ? <Button variant="contained" onClick={() => setOpen(true)}>Create</Button> : undefined}
      />
      <Paper>
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
            {(data?.data ?? []).map((row) => {
              const item = row as Row;
              const id = String(item._id);
              const invoice = item.invoiceId as Row | string | null | undefined;
              const invoiceId = invoice && typeof invoice === 'object' ? String(invoice._id ?? '') : invoice ? String(invoice) : '';
              const invoiceNumber = invoice && typeof invoice === 'object' ? String(invoice.invoiceNumber ?? '') : '';
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
                    <Stack direction="row" gap={1}>
                      <Button size="small" onClick={() => navigate(`${listPath}/${id}`)}>View</Button>
                      {invoiceId && canViewBill ? (
                        <Button size="small" onClick={() => navigate(`/app/invoices/${invoiceId}`)}>Bill</Button>
                      ) : canBill ? (
                        <Button size="small" variant="outlined" onClick={() => setBillId(id)}>Generate bill</Button>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{kind === 'inward' ? 'New inward' : 'New outward'}</DialogTitle>
        <DialogContent>
          <StorageFields form={form} setForm={setForm} />
          <TextField
            sx={{ mt: 2 }}
            fullWidth
            label="Vehicle number"
            value={form.vehicleNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
          />
          {save.isError ? (
            <Typography color="error" variant="body2" mt={1}>
              {(save.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed'}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </DialogActions>
      </Dialog>
      <GenerateBillDialog sourceType={kind} sourceId={billId} open={Boolean(billId)} onClose={() => setBillId('')} />
    </>
  );
}

export function StockLedgerPage() {
  const { data } = useQuery({ queryKey: ['stock-transactions'], queryFn: () => listResource('/stock-transactions', { limit: 50 }) });
  return (
    <>
      <PageHeader title="Stock ledger" subtitle="Immutable stock transactions. Inventory is never edited without a row here." />
      <Paper>
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
            {(data?.data ?? []).map((row) => {
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
      </Paper>
    </>
  );
}
