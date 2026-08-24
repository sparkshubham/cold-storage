import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { activateCompany, deleteCompany, listCompanies, suspendCompany } from '../api/companies';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader, StatusChip } from '../components/PageHeader';
import type { Company } from '../types';

export function CompaniesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState<Company | null>(null);
  const params = useMemo(() => ({ search, status, page: 1, limit: 20 }), [search, status]);
  const { data } = useQuery({ queryKey: ['companies', params], queryFn: () => listCompanies(params) });

  const suspend = useMutation({
    mutationFn: (id: string) => suspendCompany(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
  const activate = useMutation({
    mutationFn: (id: string) => activateCompany(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setTarget(null);
    },
  });

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle="Create, suspend, activate, and inspect tenant companies"
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/super-admin/companies/new')}>Add company</Button>}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
        <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="trial">Trial</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
        </TextField>
      </Stack>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.data ?? []).map((company) => (
              <TableRow key={company._id} hover>
                <TableCell>{company.name}</TableCell>
                <TableCell>{company.email}</TableCell>
                <TableCell>{company.storageCapacity} {company.capacityUnit}</TableCell>
                <TableCell><StatusChip value={company.status} /></TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => navigate(`/super-admin/companies/${company._id}`)}><VisibilityIcon /></IconButton>
                  {company.status === 'suspended' ? (
                    <Button size="small" onClick={() => activate.mutate(company._id)}>Activate</Button>
                  ) : (
                    <Button size="small" onClick={() => suspend.mutate(company._id)}>Suspend</Button>
                  )}
                  <Button size="small" color="error" onClick={() => setTarget(company)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <ConfirmDialog
        open={Boolean(target)}
        title="Delete company"
        message={`Soft-delete ${target?.name ?? ''}? Historical records stay in the database.`}
        confirmLabel="Delete"
        onClose={() => setTarget(null)}
        onConfirm={() => target && remove.mutate(target._id)}
      />
    </>
  );
}
