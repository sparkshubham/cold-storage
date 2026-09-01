import { useEffect, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Paginated } from '../types';

const PAGE_SIZES = [10, 20, 50];

export function usePagedList<T>(
  queryKey: unknown[],
  fetchPage: (params: { page: number; limit: number; search?: string } & Record<string, string | number | undefined>) => Promise<Paginated<T>>,
  extra: Record<string, string | number | undefined> = {},
) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const extraKey = JSON.stringify(extra);

  useEffect(() => {
    setPage(0);
  }, [extraKey]);

  const query = useQuery({
    queryKey: [...queryKey, page + 1, rowsPerPage, search, extra],
    queryFn: () =>
      fetchPage({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        ...extra,
      }),
  });

  return {
    ...query,
    rows: query.data?.data ?? [],
    total: query.data?.pagination.total ?? 0,
    page,
    rowsPerPage,
    pageSizes: PAGE_SIZES,
    searchInput,
    setSearchInput,
    applySearch: () => {
      setPage(0);
      setSearch(searchInput.trim());
    },
    onPageChange: (_event: unknown, next: number) => setPage(next),
    onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(Number(event.target.value));
      setPage(0);
    },
  };
}
