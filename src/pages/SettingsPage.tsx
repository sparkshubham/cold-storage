import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  IconButton,
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
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { listResource } from '../api/resources';
import { getSettings, updateSettings, type UnitRate } from '../api/settings';
import { BusyButton, PageSpinner } from '../components/Loading';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage, companySettingsSchema, validateForm } from '../validation/schemas';

const emptyRow: UnitRate = {
  unit: '',
  storageRatePerUnitPerDay: 0,
  inwardHandlingRate: 0,
  outwardHandlingRate: 0,
};

type FormState = {
  invoicePrefix: string;
  defaultGstRate: number;
  storageRatePerUnitPerDay: number;
  inwardHandlingRate: number;
  outwardHandlingRate: number;
  unitRates: UnitRate[];
};

export function SettingsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = hasPermission('settings.update');
  const [form, setForm] = useState<FormState>({
    invoicePrefix: 'INV',
    defaultGstRate: 18,
    storageRatePerUnitPerDay: 20,
    inwardHandlingRate: 40,
    outwardHandlingRate: 40,
    unitRates: [],
  });
  const [newUnit, setNewUnit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isPending, isError } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const { data: unitsPage } = useQuery({
    queryKey: ['units', 'options'],
    queryFn: () => listResource('/units', { limit: 100 }),
  });
  const units = (unitsPage?.data ?? []) as Array<{ _id: string; name?: string; code?: string }>;

  useEffect(() => {
    if (!data) return;
    setForm({
      invoicePrefix: data.invoicePrefix || 'INV',
      defaultGstRate: Number(data.defaultGstRate ?? 18),
      storageRatePerUnitPerDay: Number(data.storageRatePerUnitPerDay ?? 20),
      inwardHandlingRate: Number(data.inwardHandlingRate ?? 40),
      outwardHandlingRate: Number(data.outwardHandlingRate ?? 40),
      unitRates: (data.unitRates ?? []).map((row) => ({
        unit: String(row.unit ?? '').toUpperCase(),
        storageRatePerUnitPerDay: Number(row.storageRatePerUnitPerDay ?? 0),
        inwardHandlingRate: Number(row.inwardHandlingRate ?? 0),
        outwardHandlingRate: Number(row.outwardHandlingRate ?? 0),
      })),
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateSettings(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setErrors({});
    },
  });

  const submit = () => {
    const result = validateForm(companySettingsSchema, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    save.mutate();
  };

  const setRow = (index: number, patch: Partial<UnitRate>) => {
    setForm((prev) => ({
      ...prev,
      unitRates: prev.unitRates.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const addUnit = (code: string) => {
    const unit = code.trim().toUpperCase();
    if (!unit || form.unitRates.some((row) => row.unit === unit)) return;
    setForm((prev) => ({
      ...prev,
      unitRates: [
        ...prev.unitRates,
        {
          ...emptyRow,
          unit,
          storageRatePerUnitPerDay: prev.storageRatePerUnitPerDay,
          inwardHandlingRate: prev.inwardHandlingRate,
          outwardHandlingRate: prev.outwardHandlingRate,
        },
      ],
    }));
    setNewUnit('');
  };

  if (isPending) return <PageSpinner />;
  if (isError) return <Typography color="error">Could not load billing settings.</Typography>;

  const used = new Set(form.unitRates.map((row) => row.unit));
  const unusedUnits = units.filter((unit) => unit.code && !used.has(String(unit.code).toUpperCase()));

  return (
    <>
      <PageHeader
        title="Billing settings"
        subtitle="Set how much you charge per MT, bag, kg, or any other unit. Bills pick the row that matches the slip unit."
        actions={canEdit ? <BusyButton variant="contained" loading={save.isPending} onClick={submit}>Save</BusyButton> : undefined}
      />
      {save.isError ? <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(save.error, 'Save failed')}</Alert> : null}
      {save.isSuccess ? <Alert severity="success" sx={{ mb: 2 }}>Settings saved. New bills will use these rates.</Alert> : null}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Tax and defaults</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Defaults are used when a slip unit does not have its own row below.
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
          <TextField
            label="Invoice prefix"
            value={form.invoicePrefix}
            disabled={!canEdit}
            error={Boolean(errors.invoicePrefix)}
            helperText={errors.invoicePrefix}
            onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value.toUpperCase() })}
          />
          <TextField
            label="GST %"
            type="number"
            value={form.defaultGstRate}
            disabled={!canEdit}
            error={Boolean(errors.defaultGstRate)}
            helperText={errors.defaultGstRate}
            onChange={(e) => setForm({ ...form, defaultGstRate: Number(e.target.value) })}
          />
          <TextField
            label="Default storage ₹ / unit / day"
            type="number"
            value={form.storageRatePerUnitPerDay}
            disabled={!canEdit}
            error={Boolean(errors.storageRatePerUnitPerDay)}
            helperText={errors.storageRatePerUnitPerDay}
            onChange={(e) => setForm({ ...form, storageRatePerUnitPerDay: Number(e.target.value) })}
          />
          <TextField
            label="Default inward handling ₹ / unit"
            type="number"
            value={form.inwardHandlingRate}
            disabled={!canEdit}
            error={Boolean(errors.inwardHandlingRate)}
            helperText={errors.inwardHandlingRate}
            onChange={(e) => setForm({ ...form, inwardHandlingRate: Number(e.target.value) })}
          />
          <TextField
            label="Default outward handling ₹ / unit"
            type="number"
            value={form.outwardHandlingRate}
            disabled={!canEdit}
            error={Boolean(errors.outwardHandlingRate)}
            helperText={errors.outwardHandlingRate}
            onChange={(e) => setForm({ ...form, outwardHandlingRate: Number(e.target.value) })}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={1}>Rates by unit</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Example: MT at ₹20/day and BAG at ₹2/day. A 10 BAG outward for 11 days is 10 × ₹2 × 11 = ₹220 storage, plus handling.
        </Typography>
        {errors.unitRates ? <Alert severity="error" sx={{ mb: 2 }}>{errors.unitRates}</Alert> : null}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Unit</TableCell>
              <TableCell>Storage ₹ / unit / day</TableCell>
              <TableCell>Inward handling ₹ / unit</TableCell>
              <TableCell>Outward handling ₹ / unit</TableCell>
              {canEdit ? <TableCell align="right"> </TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {form.unitRates.map((row, index) => (
              <TableRow key={`${row.unit}-${index}`}>
                <TableCell sx={{ minWidth: 120 }}>
                  <TextField
                    size="small"
                    value={row.unit}
                    disabled={!canEdit}
                    error={Boolean(errors[`unitRates.${index}.unit`] || errors.unit)}
                    onChange={(e) => setRow(index, { unit: e.target.value.toUpperCase() })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={row.storageRatePerUnitPerDay}
                    disabled={!canEdit}
                    onChange={(e) => setRow(index, { storageRatePerUnitPerDay: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={row.inwardHandlingRate}
                    disabled={!canEdit}
                    onChange={(e) => setRow(index, { inwardHandlingRate: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={row.outwardHandlingRate}
                    disabled={!canEdit}
                    onChange={(e) => setRow(index, { outwardHandlingRate: Number(e.target.value) })}
                  />
                </TableCell>
                {canEdit ? (
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => setForm((prev) => ({ ...prev, unitRates: prev.unitRates.filter((_, i) => i !== index) }))}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {canEdit ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} mt={2} alignItems={{ sm: 'center' }}>
            {unusedUnits.length ? (
              <TextField
                select
                size="small"
                label="Add from units master"
                value=""
                sx={{ minWidth: 220 }}
                onChange={(e) => addUnit(e.target.value)}
              >
                {unusedUnits.map((unit) => (
                  <MenuItem key={unit._id} value={String(unit.code)}>
                    {unit.code}{unit.name ? ` — ${unit.name}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            <TextField
              size="small"
              label="Or type unit code"
              placeholder="QTL"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addUnit(newUnit);
                }
              }}
            />
            <Button startIcon={<AddIcon />} onClick={() => addUnit(newUnit)} disabled={!newUnit.trim()}>
              Add unit
            </Button>
          </Stack>
        ) : null}
      </Paper>
    </>
  );
}
