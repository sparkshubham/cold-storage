import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('admin@example.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password);
      navigate(user.role === 'super_admin' ? '/super-admin/dashboard' : '/app/dashboard');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Login failed';
      setError(String(message ?? 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #0A2540, #0B4F6C)' }}>
      <Paper sx={{ width: '100%', maxWidth: 440, p: 4 }}>
        <Stack direction="row" alignItems="center" gap={1} mb={1}>
          <AcUnitIcon color="primary" />
          <Typography variant="h5">ColdFlow</Typography>
        </Stack>
        <Typography color="text.secondary" mb={3}>
          Sign in to the cold storage ERP
        </Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <Box component="form" onSubmit={onSubmit}>
          <TextField label="Email or mobile" fullWidth sx={{ mb: 2 }} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <TextField label="Password" type="password" fullWidth sx={{ mb: 2 }} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>
        <Typography variant="body2" mt={2}>
          <Link component={RouterLink} to="/forgot-password">Forgot password?</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
