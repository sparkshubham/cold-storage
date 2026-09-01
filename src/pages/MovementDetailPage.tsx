import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Divider, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import { cancelResource, getResource, updateResource } from '../api/resources';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GenerateBillDialog, formatDate } from '../components/GenerateBillDialog';
import { BusyButton, PageSpinner } from '../components/Loading';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage, movementMetaSchema, validateForm } from '../validation/schemas';

type Row = Record<string, unknown>;

function labelOf(value: unknown) {
  if (value && typeof value === 'object') {
    const obj = value as Row;
    return String(obj.name ?? obj.code ?? obj.batchNumber ?? '');
  }
  return value == null ? '—' : String(value);
}

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography>{value == null || value === '' ? '—' : String(value)}</Typography>
    </Grid>
  );
}

function invoiceIdOf(value: unknown) {
  if (value && typeof value === 'object' && '_id' in (value as Row)) return String((value as Row)._id);
  return value ? String(value) : '';
}

export function MovementDetailPage({ kind }: { kind: 'inward' | 'outward' }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [billOpen, setBillOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [form, setForm] = useState({ vehicleNumber: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const path = kind === 'inward' ? '/inwards' : '/outwards';
  const { data, isError, isPending } = useQuery({
    queryKey: [kind, id],
    queryFn: () => getResource<Row>(`${path}/${id}`),
    enabled: Boolean(id),
  });
  const slip = data?.data;
  const invoice = slip?.invoiceId as Row | string | null | undefined;
  const billed = Boolean(invoice);
  const cancelled = String(slip?.status ?? '') === 'cancelled';
  const canBill = hasPermission('invoice.create');
  const canUpdate = hasPermission(kind === 'inward' ? 'inward.update' : 'outward.update');
  const canCancel = hasPermission(kind === 'inward' ? 'inward.cancel' : 'outward.cancel');

  useEffect(() => {
    if (!slip) return;
    setForm({
      vehicleNumber: String(slip.vehicleNumber ?? ''),
      notes: String(slip.notes ?? ''),
    });
    setEditing(false);
    setErrors({});
  }, [slip]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateResource(path, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [kind, id] });
      queryClient.invalidateQueries({ queryKey: [kind] });
      setEditing(false);
    },
  });
  const cancel = useMutation({
    mutationFn: () => cancelResource(path, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [kind, id] });
      queryClient.invalidateQueries({ queryKey: [kind] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      setCancelOpen(false);
    },
  });

  if (isError) {
    return <Typography color="error">This {kind} slip was not found.</Typography>;
  }
  if (isPending || !slip) {
    return <PageSpinner />;
  }

  const customer = (slip.customerId && typeof slip.customerId === 'object' ? slip.customerId : {}) as Row;
  const product = (slip.productId && typeof slip.productId === 'object' ? slip.productId : {}) as Row;
  const number = String(slip.inwardNumber ?? slip.outwardNumber ?? '');

  const submit = () => {
    const result = validateForm(movementMetaSchema, form);
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
        title={number || (kind === 'inward' ? 'Inward' : 'Outward')}
        subtitle={`${kind === 'inward' ? 'Inward' : 'Outward'} slip`}
        actions={
          <Stack direction="row" gap={1} flexWrap="wrap" className="no-print">
            <Button variant="outlined" onClick={() => navigate(kind === 'inward' ? '/app/inwards' : '/app/outwards')}>Back</Button>
            <Button variant="outlined" onClick={() => window.print()}>Print</Button>
            {canUpdate && !cancelled && !editing ? <Button variant="outlined" onClick={() => setEditing(true)}>Edit</Button> : null}
            {canCancel && !cancelled && !billed ? <Button color="error" onClick={() => setCancelOpen(true)}>Cancel slip</Button> : null}
            {billed ? (
              <Button variant="contained" onClick={() => navigate(`/app/invoices/${invoiceIdOf(invoice)}`)}>
                Open bill {typeof invoice === 'object' && invoice ? String(invoice.invoiceNumber ?? '') : ''}
              </Button>
            ) : !cancelled && canBill ? (
              <Button variant="contained" onClick={() => setBillOpen(true)}>Generate bill</Button>
            ) : null}
          </Stack>
        }
      />
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <div>
            <Typography variant="h6">{kind === 'inward' ? 'Inward slip' : 'Outward slip'}</Typography>
            <Typography color="text.secondary">{number}</Typography>
          </div>
          <StatusChip value={String(slip.status ?? '')} />
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Field label="Date" value={formatDate(slip.date)} />
          <Field label="Customer" value={`${labelOf(customer)}${customer.code ? ` (${customer.code})` : ''}`} />
          <Field label="Mobile" value={customer.mobile} />
          <Field label="GSTIN" value={customer.gstin} />
          <Field label="Address" value={[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')} />
          <Field label="Product" value={`${labelOf(product)}${product.hsn ? ` · HSN ${product.hsn}` : ''}`} />
          <Field label="Quantity" value={`${slip.quantity ?? 0} ${slip.unit ?? ''}`} />
          <Field label="Chamber" value={labelOf(slip.chamberId)} />
          <Field label="Rack" value={labelOf(slip.rackId)} />
          <Field label="Location" value={labelOf(slip.locationId)} />
          <Field label="Batch" value={labelOf(slip.batchId)} />
          {editing ? (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Vehicle"
                  fullWidth
                  value={form.vehicleNumber}
                  error={Boolean(errors.vehicleNumber)}
                  helperText={errors.vehicleNumber}
                  onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  minRows={2}
                  value={form.notes}
                  error={Boolean(errors.notes)}
                  helperText={errors.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Grid>
            </>
          ) : (
            <>
              <Field label="Vehicle" value={slip.vehicleNumber} />
              <Field label="Notes" value={slip.notes} />
            </>
          )}
        </Grid>
        {save.isError ? (
          <Typography color="error" variant="body2" mt={2}>{apiErrorMessage(save.error, 'Save failed')}</Typography>
        ) : null}
        {editing ? (
          <Stack direction="row" gap={1} mt={2} className="no-print">
            <Button onClick={() => { setEditing(false); setForm({ vehicleNumber: String(slip.vehicleNumber ?? ''), notes: String(slip.notes ?? '') }); }}>Cancel</Button>
            <BusyButton variant="contained" loading={save.isPending} onClick={submit}>Save</BusyButton>
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary" display="block" mt={2}>
            Quantity and location cannot be edited after posting. Cancel the slip to reverse stock, then create a new one if needed.
          </Typography>
        )}
      </Paper>
      <GenerateBillDialog sourceType={kind} sourceId={id} open={billOpen} onClose={() => setBillOpen(false)} />
      <ConfirmDialog
        open={cancelOpen}
        title={`Cancel ${kind}`}
        message="This reverses the stock quantity. You cannot cancel a billed slip until the bill is cancelled."
        confirmLabel="Cancel slip"
        loading={cancel.isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancel.mutate()}
      />
    </>
  );
}
