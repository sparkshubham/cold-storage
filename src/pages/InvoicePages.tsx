import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Divider,
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
import { cancelResource, getResource, listResource, updateResource } from '../api/resources';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDate, inr } from '../components/GenerateBillDialog';
import { ListSearch, TablePager } from '../components/ListControls';
import { BusyButton, PageSpinner, TableLoading } from '../components/Loading';
import { PageHeader, StatusChip } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { usePagedList } from '../hooks/usePagedList';
import { apiErrorMessage, invoiceNotesSchema, validateForm } from '../validation/schemas';

type Row = Record<string, unknown>;

function labelOf(value: unknown) {
  if (value && typeof value === 'object') {
    const obj = value as Row;
    return String(obj.name ?? obj.code ?? obj.invoiceNumber ?? '');
  }
  return value == null ? '—' : String(value);
}

function addressOf(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const obj = value as Row;
  if (typeof obj.line1 === 'string' || typeof obj.city === 'string') {
    return [obj.line1, obj.line2, obj.city, obj.state, obj.pincode].filter(Boolean).join(', ');
  }
  return [obj.address, obj.city, obj.state, obj.pincode].filter(Boolean).join(', ');
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const list = usePagedList(['invoices'], (params) => listResource('/invoices', params));
  const [cancelId, setCancelId] = useState('');
  const cancel = useMutation({
    mutationFn: (id: string) => cancelResource('/invoices', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inwards'] });
      queryClient.invalidateQueries({ queryKey: ['outwards'] });
      setCancelId('');
    },
  });

  return (
    <>
      <PageHeader
        title="Bills"
        subtitle="Invoices generated from inward and outward slips. Storage rent is calculated on outward."
      />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
      <Paper>
        <TableLoading loading={list.isFetching}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bill no.</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Source</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="no-print">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!list.isFetching && list.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}><Typography color="text.secondary">No bills yet.</Typography></TableCell>
                </TableRow>
              ) : list.rows.map((row) => {
                const item = row as Row;
                const cancelled = String(item.status ?? '') === 'cancelled';
                return (
                  <TableRow
                    key={String(item._id)}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/app/invoices/${item._id}`)}
                  >
                    <TableCell>{String(item.invoiceNumber ?? '')}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{labelOf(item.customerId)}</TableCell>
                    <TableCell>{String(item.sourceType ?? '')}</TableCell>
                    <TableCell align="right">{inr.format(Number(item.total ?? 0))}</TableCell>
                    <TableCell><StatusChip value={String(item.status ?? '')} /></TableCell>
                    <TableCell className="no-print" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" gap={1}>
                        <Button size="small" onClick={() => navigate(`/app/invoices/${item._id}`)}>View</Button>
                        {hasPermission('invoice.delete') && !cancelled ? (
                          <Button size="small" color="error" onClick={() => setCancelId(String(item._id))}>Cancel</Button>
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
      <ConfirmDialog
        open={Boolean(cancelId)}
        title="Cancel bill"
        message="The slip can be billed again after this invoice is cancelled. Totals are not changed."
        confirmLabel="Cancel bill"
        loading={cancel.isPending}
        onClose={() => setCancelId('')}
        onConfirm={() => cancelId && cancel.mutate(cancelId)}
      />
    </>
  );
}

export function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const { data, isError, isPending } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getResource<{ invoice: Row; company: Row | null }>(`/invoices/${id}`),
    enabled: Boolean(id),
  });
  const payload = data?.data;
  const invoice = payload?.invoice;
  const company = payload?.company;

  useEffect(() => {
    if (!invoice) return;
    setNotes(String(invoice.notes ?? ''));
    setEditing(false);
  }, [invoice]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateResource('/invoices', id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setEditing(false);
    },
  });
  const cancel = useMutation({
    mutationFn: () => cancelResource('/invoices', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inwards'] });
      queryClient.invalidateQueries({ queryKey: ['outwards'] });
      setCancelOpen(false);
    },
  });

  if (isError) return <Typography color="error">This bill was not found.</Typography>;
  if (isPending || !invoice) return <PageSpinner />;

  const customer = (invoice.customerId && typeof invoice.customerId === 'object' ? invoice.customerId : {}) as Row;
  const items = (Array.isArray(invoice.items) ? invoice.items : []) as Array<Row>;
  const sourcePath = invoice.sourceType === 'outward' ? '/app/outwards' : '/app/inwards';
  const sourceId = String(invoice.sourceId ?? invoice.outwardId ?? invoice.inwardId ?? '');
  const cancelled = String(invoice.status ?? '') === 'cancelled';

  const submitNotes = () => {
    const result = validateForm(invoiceNotesSchema, { notes });
    if (!result.ok) return;
    save.mutate(result.data as Record<string, unknown>);
  };

  return (
    <>
      <PageHeader
        title={String(invoice.invoiceNumber ?? 'Bill')}
        subtitle="Tax invoice"
        actions={
          <Stack direction="row" gap={1} className="no-print">
            <Button variant="outlined" onClick={() => navigate('/app/invoices')}>All bills</Button>
            {sourceId ? (
              <Button variant="outlined" onClick={() => navigate(`${sourcePath}/${sourceId}`)}>
                Open {String(invoice.sourceType)} slip
              </Button>
            ) : null}
            {hasPermission('invoice.update') && !cancelled && !editing ? (
              <Button variant="outlined" onClick={() => setEditing(true)}>Edit notes</Button>
            ) : null}
            {hasPermission('invoice.delete') && !cancelled ? (
              <Button color="error" onClick={() => setCancelOpen(true)}>Cancel bill</Button>
            ) : null}
            <Button variant="contained" onClick={() => window.print()}>Print</Button>
          </Stack>
        }
      />
      <Paper sx={{ p: 3, maxWidth: 900 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={2}>
          <div>
            <Typography variant="h6">{String(company?.legalName || company?.name || 'Cold storage')}</Typography>
            <Typography variant="body2" color="text.secondary">{addressOf(company?.address)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {[company?.mobile, company?.email].filter(Boolean).join(' · ')}
            </Typography>
            {company?.gstin ? <Typography variant="body2">GSTIN {String(company.gstin)}</Typography> : null}
          </div>
          <div>
            <Typography variant="h6">TAX INVOICE</Typography>
            <Typography>{String(invoice.invoiceNumber)}</Typography>
            <Typography variant="body2">Date: {formatDate(invoice.date)}</Typography>
            <StatusChip value={String(invoice.status ?? '')} />
          </div>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={2}>
          <div>
            <Typography variant="caption" color="text.secondary">Bill to</Typography>
            <Typography fontWeight={700}>{labelOf(customer)}</Typography>
            <Typography variant="body2">{addressOf(customer)}</Typography>
            {customer.mobile ? <Typography variant="body2">{String(customer.mobile)}</Typography> : null}
            {customer.gstin ? <Typography variant="body2">GSTIN {String(customer.gstin)}</Typography> : null}
          </div>
          <div>
            <Typography variant="body2">Source: {String(invoice.sourceType)}</Typography>
            {Number(invoice.storageDays) > 0 ? (
              <Typography variant="body2">
                Storage: {formatDate(invoice.storageFrom)} – {formatDate(invoice.storageTo)} ({String(invoice.storageDays)} day{Number(invoice.storageDays) === 1 ? '' : 's'})
              </Typography>
            ) : null}
            <Typography variant="body2">
              Qty: {String(invoice.quantity ?? '')} {String(invoice.unit ?? '')}
            </Typography>
          </div>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>HSN</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Rate</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item.description}-${index}`}>
                <TableCell>{String(item.description ?? '')}</TableCell>
                <TableCell>{String(item.hsn || '—')}</TableCell>
                <TableCell align="right">
                  {String(item.quantity ?? '')} {String(item.unit ?? '')}
                </TableCell>
                <TableCell align="right">{inr.format(Number(item.rate ?? 0))}</TableCell>
                <TableCell align="right">{inr.format(Number(item.amount ?? 0))}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4} align="right">Subtotal</TableCell>
              <TableCell align="right">{inr.format(Number(invoice.subtotal ?? 0))}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} align="right">GST {String(invoice.gstRate ?? 0)}%</TableCell>
              <TableCell align="right">{inr.format(Number(invoice.gstAmount ?? 0))}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} align="right"><strong>Total</strong></TableCell>
              <TableCell align="right"><strong>{inr.format(Number(invoice.total ?? 0))}</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        {editing ? (
          <Stack gap={1} mt={2} className="no-print">
            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline minRows={2} />
            {save.isError ? <Typography color="error" variant="body2">{apiErrorMessage(save.error, 'Save failed')}</Typography> : null}
            <Stack direction="row" gap={1}>
              <Button onClick={() => { setEditing(false); setNotes(String(invoice.notes ?? '')); }}>Cancel</Button>
              <BusyButton variant="contained" loading={save.isPending} onClick={submitNotes}>Save notes</BusyButton>
            </Stack>
          </Stack>
        ) : invoice.notes ? (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Notes: {String(invoice.notes)}
          </Typography>
        ) : null}
      </Paper>
      <ConfirmDialog
        open={cancelOpen}
        title="Cancel bill"
        message="The linked inward or outward can be billed again after cancellation."
        confirmLabel="Cancel bill"
        loading={cancel.isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancel.mutate()}
      />
    </>
  );
}
