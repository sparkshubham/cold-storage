import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0B4F6C', dark: '#083B51', light: '#1478A3' },
    secondary: { main: '#01BAEF' },
    success: { main: '#1B9C85' },
    warning: { main: '#E09F3E' },
    error: { main: '#C1121F' },
    background: { default: '#F4F7FB', paper: '#FFFFFF' },
    text: { primary: '#102A43', secondary: '#486581' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: '100%' },
        body: { height: '100%', margin: 0 },
        '#root': { minHeight: '100%', height: '100%' },
        '@media print': {
          html: { height: 'auto' },
          body: { height: 'auto', background: '#fff' },
          '#root': { height: 'auto' },
          '.no-print': { display: 'none !important' },
        },
      },
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 10, paddingInline: 16 } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
});
