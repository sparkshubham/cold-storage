import { useEffect, useState, type ReactNode } from 'react';
import { Box, Button, CircularProgress, LinearProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';
import { subscribeApiLoading } from '../api/loading';

export function ApiLoadingOverlay() {
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeApiLoading(setPending), []);
  useEffect(() => {
    if (pending <= 0) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, [pending]);

  if (!visible) return null;
  return (
    <>
      <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000, height: 3 }} />
      <Box sx={{ position: 'fixed', top: 12, right: 16, zIndex: 2000, pointerEvents: 'none' }}>
        <CircularProgress size={28} />
      </Box>
    </>
  );
}

export function TableLoading({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <Box sx={{ position: 'relative', minHeight: loading ? 180 : undefined }}>
      {loading ? <LinearProgress sx={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 2 }} /> : null}
      {children}
      {loading ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.65)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      ) : null}
    </Box>
  );
}

export function BusyButton({
  loading,
  children,
  ...props
}: ButtonProps & { loading?: boolean }) {
  return (
    <Button {...props} disabled={Boolean(loading) || props.disabled}>
      {loading ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
      {children}
    </Button>
  );
}

export function PageSpinner() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
}
