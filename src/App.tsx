import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { AppShell } from './layouts/AppShell';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SuperDashboardPage } from './pages/SuperDashboardPage';
import { CompanyDashboardPage } from './pages/CompanyDashboardPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { CompanyFormPage } from './pages/CompanyFormPage';
import { CompanyDetailPage } from './pages/CompanyDetailPage';
import { PlansPage } from './pages/PlansPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import {
  CategoriesPage,
  ChambersPage,
  CustomersPage,
  LocationsPage,
  ProductsPage,
  RacksPage,
  SuppliersPage,
  UnitsPage,
} from './pages/MasterPages';
import { InventoryPage, StockLedgerPage, StockMovementPage } from './pages/InventoryPages';

function Guest({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to={user.role === 'super_admin' ? '/super-admin/dashboard' : '/app/dashboard'} replace />;
  return children;
}

function Splash() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Splash />;

  return (
    <Routes>
      <Route path="/login" element={<Guest><LoginPage /></Guest>} />
      <Route path="/forgot-password" element={<Guest><ForgotPasswordPage /></Guest>} />
      <Route path="/reset-password" element={<Guest><ResetPasswordPage /></Guest>} />

      <Route path="/super-admin" element={<AppShell variant="super" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperDashboardPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="companies/new" element={<CompanyFormPage />} />
        <Route path="companies/:id" element={<CompanyDetailPage />} />
        <Route path="companies/:id/edit" element={<CompanyFormPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      <Route path="/app" element={<AppShell variant="company" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CompanyDashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="units" element={<UnitsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="chambers" element={<ChambersPage />} />
        <Route path="racks" element={<RacksPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inwards" element={<StockMovementPage kind="inward" />} />
        <Route path="outwards" element={<StockMovementPage kind="outward" />} />
        <Route path="stock-ledger" element={<StockLedgerPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
