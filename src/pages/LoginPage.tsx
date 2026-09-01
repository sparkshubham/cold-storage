import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BusyButton } from '../components/Loading';
import { loginSchema, validateForm } from '../validation/schemas';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('admin@example.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const result = validateForm(loginSchema, { identifier, password });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const user = await login(result.data.identifier, result.data.password);
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
        <Box component="form" onSubmit={onSubmit} noValidate>
          <TextField
            label="Email or mobile"
            fullWidth
            sx={{ mb: 2 }}
            value={identifier}
            error={Boolean(errors.identifier)}
            helperText={errors.identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            sx={{ mb: 2 }}
            value={password}
            error={Boolean(errors.password)}
            helperText={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <BusyButton type="submit" fullWidth variant="contained" size="large" loading={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </BusyButton>
        </Box>
        <Typography variant="body2" mt={2}>
          <Link component={RouterLink} to="/forgot-password">Forgot password?</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
