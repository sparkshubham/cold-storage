import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Paper, TextField, Typography } from '@mui/material';
import { forgotPassword } from '../api/auth';
import axios from 'axios';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      setToken(result.data.resetToken ?? '');
    } catch (err) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.message ?? 'Request failed') : 'Request failed');
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
        <Box component="form" onSubmit={onSubmit}>
          <TextField label="Email" type="email" fullWidth sx={{ mb: 2 }} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth>Send reset link</Button>
        </Box>
        <Link component={RouterLink} to="/login" sx={{ display: 'inline-block', mt: 2 }}>Back to login</Link>
      </Paper>
    </Box>
  );
}
