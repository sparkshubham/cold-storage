import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { getCompany } from '../api/companies';
import { PageSpinner } from '../components/Loading';
import { PageHeader, StatusChip } from '../components/PageHeader';

export function CompanyDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isError, isPending } = useQuery({ queryKey: ['company', id], queryFn: () => getCompany(id), enabled: Boolean(id) });
  const company = data?.company;

  if (isError) return <Typography color="error">This company was not found.</Typography>;
  if (isPending || !company) return <PageSpinner />;

  const plan = typeof company.planId === 'object' ? company.planId : null;

  return (
    <>
      <PageHeader
        title={company.name}
        subtitle={company.legalName || company.email}
        actions={
          <Stack direction="row" gap={1} alignItems="center">
            <StatusChip value={company.status} />
            <Button variant="contained" onClick={() => navigate(`/super-admin/companies/${company._id}/edit`)}>Edit</Button>
          </Stack>
        }
      />
      <Grid container spacing={2}>
        {[
          ['Owner', company.ownerName],
          ['Mobile', company.mobile],
          ['Email', company.email],
          ['GSTIN', company.gstin || '—'],
          ['Capacity', `${company.storageCapacity} ${company.capacityUnit}`],
          ['Chambers', company.chamberCount],
          ['Users', data?.userCount ?? 0],
          ['Plan', plan?.name ?? '—'],
        ].map(([label, value]) => (
          <Grid key={String(label)} size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{label}</Typography>
                <Typography variant="h6">{String(value)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
