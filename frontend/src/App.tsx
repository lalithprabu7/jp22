import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

import Sidebar from './components/Sidebar';
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

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refresh unread count periodically
  useEffect(() => {
    const refresh = () => {
      getNotifications()
        .then(ns => setUnreadCount(ns.filter(n => !n.read).length))
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for copilot open event from sidebar
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

  // Collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(p => !p)}
          unreadCount={unreadCount}
        />

        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
            <Route path="/settings" element={
              <div className="page-header">
                <div>
                  <h1 className="page-title">⚙️ Settings</h1>
                  <p className="page-subtitle">Application configuration coming soon.</p>
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Search Command Palette (Ctrl+K) */}
        <CommandPalette
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        {/* Copilot FAB */}
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

        {/* Copilot Drawer */}
        <CopilotDrawer
          open={copilotOpen}
          onClose={() => setCopilotOpen(false)}
        />

        {/* Toast Notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--color-surface-2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
      </div>
    </BrowserRouter>
  );
}
