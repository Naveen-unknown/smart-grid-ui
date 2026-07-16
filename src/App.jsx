import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import EnergyReadings from './pages/EnergyReadings';
import FaultManagement from './pages/FaultManagement';
import OutageManagement from './pages/OutageManagement';
import GridNodes from './pages/GridNodes';
import AIInsights from './pages/AIInsights';
import AIChat from './pages/AIChat';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import TeamAlerts from './pages/TeamAlerts';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  const { user } = useAuth();
  
  if (user?.role === 'Maintenance') {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', width: '100%' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute>{user?.role === 'Maintenance' ? <Navigate to="/team-alerts" replace /> : <AppLayout><Dashboard /></AppLayout>}</ProtectedRoute>} />
      <Route path="/energy" element={<ProtectedRoute><AppLayout><EnergyReadings /></AppLayout></ProtectedRoute>} />
      <Route path="/nodes" element={<ProtectedRoute><AppLayout><GridNodes /></AppLayout></ProtectedRoute>} />
      <Route path="/faults" element={<ProtectedRoute><AppLayout><FaultManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/outages" element={<ProtectedRoute><AppLayout><OutageManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/ai-insights" element={<ProtectedRoute><AppLayout><AIInsights /></AppLayout></ProtectedRoute>} />
      <Route path="/ai-chat" element={<ProtectedRoute><AppLayout><AIChat /></AppLayout></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><AppLayout><MaintenanceDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/team-alerts" element={<ProtectedRoute><AppLayout><TeamAlerts /></AppLayout></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0a0e1a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0a0e1a' } },
            duration: 3000,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
