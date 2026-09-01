import { Box, Chip, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2} mb={3}>
      <Box>
        <Typography variant="h5">{title}</Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions}
    </Stack>
  );
}

export function StatusChip({ value }: { value: string }) {
  const color =
    value === 'active' || value === 'paid' || value === 'completed' || value === 'issued'
      ? 'success'
      : value === 'suspended' || value === 'cancelled' || value === 'expired'
        ? 'error'
        : value === 'trial' || value === 'pending'
          ? 'warning'
          : 'default';
  return <Chip size="small" label={value} color={color} sx={{ textTransform: 'capitalize' }} />;
}
