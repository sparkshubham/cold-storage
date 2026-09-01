import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { BusyButton } from './Loading';
import { createResource, getResource } from '../api/resources';
import { billRatesSchema, validateForm } from '../validation/schemas';

export const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN');
}

type InvoiceItem = {
  description: string;
  hsn?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
};

type Rates = {
  storageRatePerUnitPerDay: number;
  inwardHandlingRate: number;
  outwardHandlingRate: number;
  gstRate: number;
};

export type InvoiceDraft = {
  sourceType: 'inward' | 'outward';
  sourceId: string;
  sourceNumber?: string;
  quantity: number;
  unit: string;
  storageDays: number;
  items: InvoiceItem[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  alreadyBilled: boolean;
  existingInvoiceId?: string | null;
  existingInvoiceNumber?: string | null;
  rates: Rates;
};

const emptyRates: Rates = {
  storageRatePerUnitPerDay: 20,
  inwardHandlingRate: 40,
  outwardHandlingRate: 40,
  gstRate: 18,
};

export function GenerateBillDialog({
  sourceType,
  sourceId,
  open,
  onClose,
}: {
  sourceType: 'inward' | 'outward';
  sourceId: string;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rates, setRates] = useState<Rates>(emptyRates);
  const [applied, setApplied] = useState<Partial<Rates>>({});
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const preview = useQuery({
    queryKey: ['invoice-preview', sourceType, sourceId, applied],
    queryFn: () => getResource<InvoiceDraft>('/invoices/preview', { sourceType, sourceId, ...applied }),
    enabled: open && Boolean(sourceId),
  });

  const draft = preview.data?.data;

  useEffect(() => {
    if (!open) {
      setApplied({});
      setNotes('');
      setErrors({});
      return;
    }
    if (draft?.rates) setRates(draft.rates);
  }, [open, draft?.rates]);

  const applyRates = () => {
    const result = validateForm(billRatesSchema, rates);
    if (!result.ok) {
      setErrors(result.errors);
      return false;
    }
    setErrors({});
    setApplied(result.data);
    return true;
  };

  const generate = useMutation({
    mutationFn: () =>
      createResource<{ invoice: { _id: string } }>('/invoices', {
        sourceType,
        sourceId,
        notes,
        ...rates,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inwards'] });
      queryClient.invalidateQueries({ queryKey: ['outwards'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: [sourceType, sourceId] });
      onClose();
      const payload = result.data as { invoice?: { _id: string }; _id?: string };
      const id = payload.invoice?._id ?? payload._id;
      if (id) navigate(`/app/invoices/${id}`);
    },
  });

  const errorMessage = (
    (generate.error ?? preview.error) as { response?: { data?: { message?: string } } } | undefined
  )?.response?.data?.message;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Generate bill</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {sourceType === 'outward'
            ? 'Storage rent is quantity × rate per day × days in store (minimum 1 day), plus handling and GST.'
            : 'Inward bills cover handling charges. Storage rent is added when you bill the matching outward.'}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
          {sourceType === 'outward' ? (
            <TextField
              label="Storage rate / unit / day"
              type="number"
              value={rates.storageRatePerUnitPerDay}
              error={Boolean(errors.storageRatePerUnitPerDay)}
              helperText={errors.storageRatePerUnitPerDay}
              onChange={(e) => setRates({ ...rates, storageRatePerUnitPerDay: Number(e.target.value) })}
              fullWidth
            />
          ) : null}
          <TextField
            label="Inward handling rate"
            type="number"
            value={rates.inwardHandlingRate}
            error={Boolean(errors.inwardHandlingRate)}
            helperText={errors.inwardHandlingRate}
            onChange={(e) => setRates({ ...rates, inwardHandlingRate: Number(e.target.value) })}
            fullWidth
          />
          {sourceType === 'outward' ? (
            <TextField
              label="Outward handling rate"
              type="number"
              value={rates.outwardHandlingRate}
              error={Boolean(errors.outwardHandlingRate)}
              helperText={errors.outwardHandlingRate}
              onChange={(e) => setRates({ ...rates, outwardHandlingRate: Number(e.target.value) })}
              fullWidth
            />
          ) : null}
          <TextField
            label="GST %"
            type="number"
            value={rates.gstRate}
            error={Boolean(errors.gstRate)}
            helperText={errors.gstRate}
            onChange={(e) => setRates({ ...rates, gstRate: Number(e.target.value) })}
            fullWidth
          />
        </Stack>
        <Button variant="outlined" onClick={() => applyRates()} sx={{ mb: 2 }}>
          Recalculate
        </Button>
        {preview.isFetching && !draft ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Calculating bill…</Typography>
        ) : null}
        {draft?.alreadyBilled ? (
          <Typography color="warning.main" sx={{ mb: 2 }}>
            Bill {draft.existingInvoiceNumber} already exists for this slip.
          </Typography>
        ) : null}
        {draft ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {draft.items.map((item) => (
                <TableRow key={item.description}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell align="right">{inr.format(item.rate)}</TableCell>
                  <TableCell align="right">{inr.format(item.amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right">Subtotal</TableCell>
                <TableCell align="right">{inr.format(draft.subtotal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} align="right">GST {draft.gstRate}%</TableCell>
                <TableCell align="right">{inr.format(draft.gstAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} align="right"><strong>Total</strong></TableCell>
                <TableCell align="right"><strong>{inr.format(draft.total)}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : null}
        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 2 }}
        />
        {errorMessage ? (
          <Typography color="error" variant="body2" mt={1}>
            {errorMessage}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {draft?.alreadyBilled && draft.existingInvoiceId ? (
          <Button variant="contained" onClick={() => navigate(`/app/invoices/${draft.existingInvoiceId}`)}>
            Open bill
          </Button>
        ) : (
          <BusyButton variant="contained" loading={generate.isPending} onClick={() => applyRates() && generate.mutate()} disabled={!draft}>
            Generate bill
          </BusyButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
