import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, RefreshCw, Building2,
  FolderOpen, Bell, Sparkles, Settings, ChevronLeft,
  ChevronRight, ShieldCheck, Calendar, BarChart3, Search,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { user, logout } = useAuth();

  return (
    <aside className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-r border-white/5 bg-[#03050a]/90 backdrop-blur-3xl ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
        <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-sm font-bold text-white tracking-tight leading-tight">ContractWatch</span>
              <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-widest">Enterprise</span>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Button */}
      <div className="p-4">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}
          className={`group flex items-center w-full rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all ${collapsed ? 'justify-center p-2' : 'px-3 py-2 justify-between'}`}
          title={collapsed ? 'Search (Ctrl+K)' : undefined}
        >
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400 group-hover:text-white transition-colors shrink-0" />
            {!collapsed && <span className="text-sm text-slate-400 group-hover:text-white transition-colors font-medium">Search...</span>}
          </div>
          {!collapsed && (
            <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-slate-300">⌘K</kbd>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 scrollbar-hide space-y-1">
        {!collapsed && <div className="px-3 pt-2 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu</div>}
        
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const isActive = to === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(to);
            
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-300' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              )}
              
              <Icon size={18} className={`shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              
              {!collapsed && <span className="truncate">{label}</span>}
              
              {badge && unreadCount > 0 && (
                collapsed ? (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse" />
                ) : (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30 text-[10px] font-bold text-rose-400 px-1.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )
              )}
            </NavLink>
          );
        })}

        {!collapsed && <div className="px-3 pt-6 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intelligence</div>}
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-copilot'))}
          title={collapsed ? 'AI Copilot' : undefined}
          className="w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <Sparkles size={18} className="shrink-0 text-purple-400 group-hover:animate-pulse" />
          {!collapsed && (
            <div className="flex flex-col items-start leading-tight">
              <span className="text-purple-300 font-semibold group-hover:text-purple-200">AI Copilot</span>
            </div>
          )}
        </button>
      </nav>

      {/* Footer Profile & Settings */}
      <div className="p-3 border-t border-white/5">
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group text-slate-400 hover:bg-white/5 hover:text-white mb-2"
        >
          <Settings size={18} className="shrink-0 text-slate-500 group-hover:text-slate-300 transition-colors" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <div className={`flex items-center rounded-xl bg-white/5 border border-white/5 overflow-hidden ${collapsed ? 'justify-center p-2' : 'p-2 gap-3 group/profile relative'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate flex-1 pr-2">
              <span className="text-xs font-bold text-white truncate">{user?.name || 'User'}</span>
              <span className="text-[10px] text-slate-400 truncate">
                {user?.email || 'admin@company.com'}
              </span>
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={logout}
              className="absolute right-2 opacity-0 group-hover/profile:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
      
      {/* Sidebar Toggle Handle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 flex items-center justify-center rounded-full bg-[#1e293b] border border-white/10 text-slate-400 hover:text-white hover:scale-110 transition-all shadow-lg z-50"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
