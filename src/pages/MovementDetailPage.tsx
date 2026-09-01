import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { getResource } from '../api/resources';
import { GenerateBillDialog, formatDate } from '../components/GenerateBillDialog';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

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
  const { hasPermission } = useAuth();
  const [billOpen, setBillOpen] = useState(false);
  const path = kind === 'inward' ? '/inwards' : '/outwards';
  const { data, isError } = useQuery({
    queryKey: [kind, id],
    queryFn: () => getResource<Row>(`${path}/${id}`),
    enabled: Boolean(id),
  });
  const slip = data?.data;
  const invoice = slip?.invoiceId as Row | string | null | undefined;
  const billed = Boolean(invoice);
  const canBill = hasPermission('invoice.create');

  if (isError) {
    return <Typography color="error">This {kind} slip was not found.</Typography>;
  }
  if (!slip) {
    return <Typography>Loading {kind}…</Typography>;
  }

  const customer = (slip.customerId && typeof slip.customerId === 'object' ? slip.customerId : {}) as Row;
  const product = (slip.productId && typeof slip.productId === 'object' ? slip.productId : {}) as Row;
  const number = String(slip.inwardNumber ?? slip.outwardNumber ?? '');

  return (
    <>
      <PageHeader
        title={number || (kind === 'inward' ? 'Inward' : 'Outward')}
        subtitle={`${kind === 'inward' ? 'Inward' : 'Outward'} slip`}
        actions={
          <Stack direction="row" gap={1} className="no-print">
            <Button variant="outlined" onClick={() => navigate(kind === 'inward' ? '/app/inwards' : '/app/outwards')}>Back</Button>
            <Button variant="outlined" onClick={() => window.print()}>Print</Button>
            {billed ? (
              <Button variant="contained" onClick={() => navigate(`/app/invoices/${invoiceIdOf(invoice)}`)}>
                Open bill {typeof invoice === 'object' && invoice ? String(invoice.invoiceNumber ?? '') : ''}
              </Button>
            ) : canBill ? (
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
          <Field label="Vehicle" value={slip.vehicleNumber} />
          <Field label="Notes" value={slip.notes} />
        </Grid>
      </Paper>
      <GenerateBillDialog sourceType={kind} sourceId={id} open={billOpen} onClose={() => setBillOpen(false)} />
    </>
  );
}
