import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { listAuditLogs } from '../api/users';
import { ListSearch, TablePager } from '../components/ListControls';
import { TableLoading } from '../components/Loading';
import { PageHeader } from '../components/PageHeader';
import { usePagedList } from '../hooks/usePagedList';

export function AuditLogsPage() {
  const list = usePagedList(['audit-logs'], (params) => listAuditLogs(params));

  return (
    <>
      <PageHeader title="Audit logs" subtitle="Create, update, delete, login, and status changes" />
      <ListSearch value={list.searchInput} onChange={list.setSearchInput} onSubmit={list.applySearch} />
      <Paper>
        <TableLoading loading={list.isFetching}>
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
              {!list.isFetching && list.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}><Typography color="text.secondary">No audit logs yet.</Typography></TableCell>
                </TableRow>
              ) : list.rows.map((item) => (
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
        </TableLoading>
        <TablePager total={list.total} page={list.page} rowsPerPage={list.rowsPerPage} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} />
      </Paper>
    </>
  );
}
