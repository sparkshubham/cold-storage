import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Link, Paper, TextField, Typography } from '@mui/material';
import { forgotPassword } from '../api/auth';
import axios from 'axios';
import { BusyButton } from '../components/Loading';
import { forgotPasswordSchema, validateForm } from '../validation/schemas';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const result = validateForm(forgotPasswordSchema, { email });
    if (!result.ok) {
      setFieldError(result.errors.email ?? 'Enter a valid email');
      return;
    }
    setFieldError('');
    setLoading(true);
    try {
      const response = await forgotPassword(result.data.email);
      setMessage(response.message);
      setToken(response.data.resetToken ?? '');
    } catch (err) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.message ?? 'Request failed') : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F4F7FB' }}>
      <Paper sx={{ width: '100%', maxWidth: 440, p: 4 }}>
        <Typography variant="h5" mb={1}>Reset password</Typography>
        <Typography color="text.secondary" mb={3}>Enter the account email. In development the reset token is returned in the API response.</Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}
        {token ? <Alert severity="info" sx={{ mb: 2 }}>Dev reset token: {token}</Alert> : null}
        <Box component="form" onSubmit={onSubmit} noValidate>
          <TextField
            label="Email"
            type="email"
            fullWidth
            sx={{ mb: 2 }}
            value={email}
            error={Boolean(fieldError)}
            helperText={fieldError}
            onChange={(e) => setEmail(e.target.value)}
          />
          <BusyButton type="submit" variant="contained" fullWidth loading={loading}>Send reset link</BusyButton>
        </Box>
        <Link component={RouterLink} to="/login" sx={{ display: 'inline-block', mt: 2 }}>Back to login</Link>
      </Paper>
    </Box>
  );
}
