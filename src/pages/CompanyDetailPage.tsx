import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import { getCompany } from '../api/companies';
import { PageHeader, StatusChip } from '../components/PageHeader';

export function CompanyDetailPage() {
  const { id = '' } = useParams();
  const { data } = useQuery({ queryKey: ['company', id], queryFn: () => getCompany(id), enabled: Boolean(id) });
  const company = data?.company;

  if (!company) {
    return <Typography>Loading company…</Typography>;
  }

  const plan = typeof company.planId === 'object' ? company.planId : null;

  return (
    <>
      <PageHeader title={company.name} subtitle={company.legalName || company.email} actions={<StatusChip value={company.status} />} />
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
