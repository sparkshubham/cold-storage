import type { ChangeEvent } from 'react';
import { Button, Stack, TablePagination, TextField } from '@mui/material';

export function ListSearch({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
      <TextField
        size="small"
        label="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
        sx={{ minWidth: 240 }}
      />
      <Button variant="outlined" onClick={onSubmit}>
        Search
      </Button>
    </Stack>
  );
}

export function TablePager({
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  pageSizes = [10, 20, 50],
}: {
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, page: number) => void;
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  pageSizes?: number[];
}) {
  return (
    <TablePagination
      component="div"
      count={total}
      page={page}
      onPageChange={onPageChange}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={onRowsPerPageChange}
      rowsPerPageOptions={pageSizes}
    />
  );
}
