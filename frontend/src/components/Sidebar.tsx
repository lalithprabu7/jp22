import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, RefreshCw, Building2,
  FolderOpen, Bell, Sparkles, Settings, ChevronLeft,
  ChevronRight, Shield
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
        <NavLink to="/settings" className="nav-item" title={collapsed ? 'Settings' : undefined}>
          <Settings size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span className="nav-item-label">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
