import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { listSubscriptions, updateSubscriptionStatus } from '../api/saas';
import { PageHeader, StatusChip } from '../components/PageHeader';

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['subscriptions'], queryFn: () => listSubscriptions({ limit: 50 }) });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateSubscriptionStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  return (
    <>
      <PageHeader title="Subscriptions" subtitle="Tenant subscription status, dates, and amounts" />
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>End date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.data ?? []).map((item) => {
              const company = typeof item.companyId === 'object' ? item.companyId : null;
              const plan = typeof item.planId === 'object' ? item.planId : null;
              return (
                <TableRow key={item._id}>
                  <TableCell>{company?.name ?? '—'}</TableCell>
                  <TableCell>{plan?.name ?? '—'}</TableCell>
                  <TableCell>₹{Number(item.amount ?? 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell>{item.endDate ? new Date(item.endDate).toLocaleDateString('en-IN') : '—'}</TableCell>
                  <TableCell>
                    <StatusChip value={item.status} />
                    <TextField
                      select
                      size="small"
                      value={item.status}
                      sx={{ ml: 1, minWidth: 140 }}
                      onChange={(e) => updateStatus.mutate({ id: item._id, status: e.target.value })}
                    >
                      {['trial', 'active', 'suspended', 'cancelled', 'expired'].map((status) => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
