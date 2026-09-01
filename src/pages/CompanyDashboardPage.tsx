import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import { getCompanyDashboard } from '../api/dashboard';
import { PageSpinner } from '../components/Loading';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

export function CompanyDashboardPage() {
  const { user } = useAuth();
  const { data, isPending } = useQuery({ queryKey: ['company-dashboard'], queryFn: getCompanyDashboard });
  const stats = data ?? {};

  if (isPending) return <PageSpinner />;

  return (
    <>
      <PageHeader title={user?.company?.name ?? 'Company dashboard'} subtitle="Live occupancy, customer, and movement totals for this tenant." />
      <Grid container spacing={2}>
        {([
          ['Total capacity', `${Number(stats.totalCapacity ?? 0).toLocaleString('en-IN')} MT`],
          ['Occupied', `${Number(stats.occupiedCapacity ?? 0).toLocaleString('en-IN')} MT`],
          ['Available', `${Number(stats.availableCapacity ?? 0).toLocaleString('en-IN')} MT`],
          ['Occupancy', `${Number(stats.occupancyPercent ?? 0)}%`],
          ['Users', Number(stats.userCount ?? 0)],
          ['Customers', Number(stats.totalCustomers ?? 0)],
          ["Today's inward", Number(stats.todaysInward ?? 0)],
          ["Today's outward", Number(stats.todaysOutward ?? 0)],
        ] as Array<[string, string | number]>).map(([label, value]) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{label}</Typography>
                <Typography variant="h5">{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
