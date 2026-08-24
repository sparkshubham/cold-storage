import { useQuery } from '@tanstack/react-query';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { listAuditLogs } from '../api/users';
import { PageHeader } from '../components/PageHeader';

export function AuditLogsPage() {
  const { data } = useQuery({ queryKey: ['audit-logs'], queryFn: () => listAuditLogs({ limit: 50 }) });

  return (
    <>
      <PageHeader title="Audit logs" subtitle="Create, update, delete, login, and status changes" />
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Module</TableCell>
              <TableCell>Record</TableCell>
              <TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.data ?? []).map((item) => (
              <TableRow key={item._id}>
                <TableCell>{new Date(item.createdAt).toLocaleString('en-IN')}</TableCell>
                <TableCell>{item.userName}</TableCell>
                <TableCell>{item.action}</TableCell>
                <TableCell>{item.module}</TableCell>
                <TableCell>{item.recordLabel}</TableCell>
                <TableCell>{item.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
