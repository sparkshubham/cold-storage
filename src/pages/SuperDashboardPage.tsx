import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getSuperAdminDashboard } from '../api/dashboard';
import { PageHeader } from '../components/PageHeader';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent>
        <Typography color="text.secondary" variant="body2">{label}</Typography>
        <Typography variant="h5">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export function SuperDashboardPage() {
  const { data } = useQuery({ queryKey: ['super-dashboard'], queryFn: getSuperAdminDashboard });
  const stats = data ?? {};
  const growth = (stats.charts as { companyGrowth?: Array<{ label: string; value: number }> } | undefined)?.companyGrowth ?? [];

  return (
    <>
      <PageHeader title="Platform dashboard" subtitle="Live tenant, subscription, and capacity totals from MongoDB" />
      <Grid container spacing={2}>
        {[
          ['Companies', stats.totalCompanies],
          ['Active', stats.activeCompanies],
          ['Trial', stats.trialCompanies],
          ['Suspended', stats.suspendedCompanies],
          ['Users', stats.totalUsers],
          ['Monthly SaaS revenue', `₹${Number(stats.monthlySaasRevenue ?? 0).toLocaleString('en-IN')}`],
          ['Expiring subscriptions', stats.expiringSubscriptions],
          ['Storage capacity', `${Number(stats.totalStorageCapacity ?? 0).toLocaleString('en-IN')} MT`],
        ].map(([label, value]) => (
          <Grid key={String(label)} size={{ xs: 12, sm: 6, md: 3 }}>
            <Stat label={String(label)} value={typeof value === 'number' || typeof value === 'string' ? value : 0} />
          </Grid>
        ))}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Company growth</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0B4F6C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
