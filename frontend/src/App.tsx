import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import CopilotDrawer from './components/CopilotDrawer';
import CommandPalette from './components/CommandPalette';

import DashboardPage from './pages/DashboardPage';
import ContractsPage from './pages/ContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import RenewalsPage from './pages/RenewalsPage';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import VendorsPage from './pages/VendorsPage';
import DocumentsPage from './pages/DocumentsPage';
import NotificationsPage from './pages/NotificationsPage';

import { getNotifications } from './services/contractService';

import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      getNotifications()
        .then(ns => setUnreadCount(ns.filter(n => !n.read).length))
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 15000);
    document.addEventListener('notifications-updated', refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener('notifications-updated', refresh);
    };
  }, []);

  useEffect(() => {
    const copilotHandler = () => setCopilotOpen(true);
    const searchHandler = () => setIsSearchOpen(true);

    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    document.addEventListener('open-copilot', copilotHandler);
    document.addEventListener('open-search', searchHandler);
    window.addEventListener('keydown', keyHandler);

    return () => {
      document.removeEventListener('open-copilot', copilotHandler);
      document.removeEventListener('open-search', searchHandler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
        unreadCount={unreadCount}
      />

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <TopNavbar
          onToggleSidebar={() => setSidebarCollapsed(p => !p)}
          unreadCount={unreadCount}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenCopilot={() => setCopilotOpen(true)}
        />

        <div className="page-container">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/contracts/:id" element={<ContractDetailPage />} />
            <Route path="/renewals" element={<RenewalsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {!copilotOpen && (
        <div className="copilot-fab">
          <button
            className="copilot-fab-btn"
            onClick={() => setCopilotOpen(true)}
            id="copilot-fab-btn"
          >
            <Sparkles size={18} />
            Copilot
          </button>
        </div>
      )}

      <CopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0c101b',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 16,
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
