import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import CardMembershipIcon from '@mui/icons-material/CardMembershipOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutline';
import HistoryIcon from '@mui/icons-material/History';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import WarehouseIcon from '@mui/icons-material/WarehouseOutlined';
import ViewModuleIcon from '@mui/icons-material/ViewModuleOutlined';
import PlaceIcon from '@mui/icons-material/PlaceOutlined';
import ScaleIcon from '@mui/icons-material/ScaleOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import RequestQuoteIcon from '@mui/icons-material/RequestQuoteOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 260;

export function AppShell({ variant }: { variant: 'super' | 'company' }) {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isSuper = user.role === 'super_admin';
  if (variant === 'super' && !isSuper) {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (variant === 'company' && isSuper) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  const items =
    variant === 'super'
      ? [
          { label: 'Dashboard', to: '/super-admin/dashboard', icon: <DashboardIcon /> },
          { label: 'Companies', to: '/super-admin/companies', icon: <BusinessIcon /> },
          { label: 'Plans', to: '/super-admin/plans', icon: <CardMembershipIcon /> },
          { label: 'Subscriptions', to: '/super-admin/subscriptions', icon: <ReceiptLongIcon /> },
          { label: 'Users', to: '/super-admin/users', icon: <PeopleIcon /> },
          { label: 'Audit logs', to: '/super-admin/audit-logs', icon: <HistoryIcon /> },
        ]
      : [
          { label: 'Dashboard', to: '/app/dashboard', icon: <DashboardIcon /> },
          { label: 'Customers', to: '/app/customers', icon: <PeopleIcon />, permission: 'customer.view' },
          { label: 'Suppliers', to: '/app/suppliers', icon: <BusinessIcon />, permission: 'supplier.view' },
          { label: 'Categories', to: '/app/categories', icon: <CategoryIcon />, permission: 'category.view' },
          { label: 'Units', to: '/app/units', icon: <ScaleIcon />, permission: 'unit.view' },
          { label: 'Products', to: '/app/products', icon: <InventoryIcon />, permission: 'product.view' },
          { label: 'Chambers', to: '/app/chambers', icon: <WarehouseIcon />, permission: 'chamber.view' },
          { label: 'Racks', to: '/app/racks', icon: <ViewModuleIcon />, permission: 'rack.view' },
          { label: 'Locations', to: '/app/locations', icon: <PlaceIcon />, permission: 'location.view' },
          { label: 'Inventory', to: '/app/inventory', icon: <InventoryIcon />, permission: 'inventory.view' },
          { label: 'Inwards', to: '/app/inwards', icon: <LocalShippingIcon />, permission: 'inward.view' },
          { label: 'Outwards', to: '/app/outwards', icon: <SwapHorizIcon />, permission: 'outward.view' },
          { label: 'Bills', to: '/app/invoices', icon: <RequestQuoteIcon />, permission: 'invoice.view' },
          { label: 'Stock ledger', to: '/app/stock-ledger', icon: <ReceiptLongIcon />, permission: 'inventory.view' },
          { label: 'Users', to: '/app/users', icon: <PeopleIcon />, permission: 'user.view' },
          { label: 'Billing settings', to: '/app/settings', icon: <SettingsIcon />, permission: 'settings.view' },
          { label: 'Audit logs', to: '/app/audit-logs', icon: <HistoryIcon />, permission: 'audit.view' },
        ].filter((item) => !item.permission || hasPermission(item.permission));

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0A2540', color: '#fff' }}>
      <Toolbar sx={{ gap: 1.5, flexShrink: 0 }}>
        <AcUnitIcon />
        <Box>
          <Typography fontWeight={800}>ColdFlow</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {variant === 'super' ? 'Platform admin' : user.company?.name ?? 'Company ERP'}
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ px: 1, py: 2, flex: 1, overflowY: 'auto' }}>
        {items.map((item) => {
          const selected = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <ListItemButton
              key={item.to}
              selected={selected}
              onClick={() => {
                navigate(item.to);
                setOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: '#fff',
                '&.Mui-selected': { bgcolor: 'rgba(1,186,239,0.18)' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <AppBar position="fixed" color="inherit" elevation={0} className="no-print" sx={{ borderBottom: '1px solid #E6EAF2', width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}>
        <Toolbar>
          {compact ? (
            <IconButton onClick={() => setOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography sx={{ flex: 1 }} color="text.secondary">
            Cold storage operations
          </Typography>
          <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>{user.name.charAt(0)}</Avatar>
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem disabled>{user.email}</MenuItem>
            <MenuItem
              onClick={async () => {
                setAnchor(null);
                await logout();
                navigate('/login');
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="nav" className="no-print" sx={{ width: { md: drawerWidth }, flexShrink: 0 }}>
        <Drawer
          variant={compact ? 'temporary' : 'permanent'}
          open={compact ? open : true}
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: {
              width: drawerWidth,
              border: 'none',
              bgcolor: '#0A2540',
              color: '#fff',
              height: '100dvh',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100dvh',
          overflow: 'auto',
          bgcolor: 'background.default',
          p: { xs: 2, md: 4 },
          pt: { xs: 10, md: 12 },
          '@media print': {
            p: 0,
            pt: 0,
            height: 'auto',
            overflow: 'visible',
          },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
