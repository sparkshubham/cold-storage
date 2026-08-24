import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Link, Paper, TextField, Typography } from '@mui/material';
import { resetPassword } from '../api/auth';
import axios from 'axios';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message ?? 'Password updated');
    } catch (err) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.message ?? 'Reset failed') : 'Reset failed');
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F4F7FB' }}>
      <Paper sx={{ width: '100%', maxWidth: 440, p: 4 }}>
        <Typography variant="h5" mb={2}>Set a new password</Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}
        <Box component="form" onSubmit={onSubmit}>
          <TextField label="Reset token" fullWidth sx={{ mb: 2 }} value={token} onChange={(e) => setToken(e.target.value)} />
          <TextField label="New password" type="password" fullWidth sx={{ mb: 2 }} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth>Update password</Button>
        </Box>
        <Link component={RouterLink} to="/login" sx={{ display: 'inline-block', mt: 2 }}>Back to login</Link>
      </Paper>
    </Box>
  );
}
