import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, RefreshCw, Building2,
  FolderOpen, Bell, Sparkles, Settings, ChevronLeft,
  ChevronRight, Shield, Calendar, BarChart3, Search, UserCheck
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  unreadCount: number;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contracts', icon: FileText, label: 'Contracts' },
  { to: '/renewals', icon: RefreshCw, label: 'Renewals' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/vendors', icon: Building2, label: 'Vendors' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
];

export default function Sidebar({ collapsed, onToggle, unreadCount }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Shield size={20} color="white" />
        </div>
        {!collapsed && (
          <div className="logo-text">
            <h2>ContractWatch</h2>
            <span>Never Miss a Renewal.</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="btn btn-ghost btn-sm btn-icon"
          style={{ marginLeft: 'auto', flexShrink: 0 }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {/* Quick Search */}
        <button
          className="nav-item search-trigger-btn"
          onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}
          title={collapsed ? 'Search (Ctrl+K)' : undefined}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '0.75rem',
          }}
        >
          <Search size={18} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span className="nav-item-label" style={{ color: 'var(--text-muted)' }}>Quick Search...</span>
              <kbd style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>⌘K</kbd>
            </div>
          )}
        </button>

        {!collapsed && <span className="nav-section-label">Main</span>}
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span className="nav-item-label">{label}</span>
                  {badge && unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </>
              )}
              {collapsed && badge && unreadCount > 0 && (
                <span
                  className="notif-dot"
                  style={{ position: 'absolute', top: 8, right: 8 }}
                />
              )}
            </NavLink>
          );
        })}

        {!collapsed && <span className="nav-section-label" style={{ marginTop: '1rem' }}>AI</span>}
        <button
          className="nav-item"
          onClick={() => document.dispatchEvent(new CustomEvent('open-copilot'))}
          title={collapsed ? 'AI Copilot' : undefined}
        >
          <Sparkles size={18} style={{ flexShrink: 0, color: '#818cf8' }} />
          {!collapsed && <span className="nav-item-label">AI Copilot</span>}
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div style={{
            padding: '0.5rem 0.75rem',
            marginBottom: '0.5rem',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <UserCheck size={14} color="#818cf8" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c7d2fe' }}>Alex Mercer</span>
              <span style={{ fontSize: '0.65rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role: ADMIN</span>
            </div>
          </div>
        )}
        <NavLink to="/settings" className="nav-item" title={collapsed ? 'Settings' : undefined}>
          <Settings size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span className="nav-item-label">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
