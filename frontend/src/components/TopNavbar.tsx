import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Sparkles, 
  Menu, ChevronRight, LayoutDashboard, FileText, 
  RefreshCw, Calendar, BarChart3, Building2, FolderOpen,
  Settings
} from 'lucide-react';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  unreadCount: number;
  onOpenSearch: () => void;
  onOpenCopilot: () => void;
  onOpenAddContract?: () => void;
}

const ROUTE_MAP: Record<string, { label: string; icon: React.ComponentType<{ size: number; className?: string }> }> = {
  '/': { label: 'Dashboard Overview', icon: LayoutDashboard },
  '/contracts': { label: 'Contracts Directory', icon: FileText },
  '/renewals': { label: 'Renewal Command Center', icon: RefreshCw },
  '/calendar': { label: 'Contract Calendar', icon: Calendar },
  '/analytics': { label: 'Portfolio Analytics', icon: BarChart3 },
  '/vendors': { label: 'Vendor Directory', icon: Building2 },
  '/documents': { label: 'Document Repository', icon: FolderOpen },
  '/notifications': { label: 'Notifications', icon: Bell },
  '/settings': { label: 'Platform Settings', icon: Settings },
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  unreadCount,
  onOpenSearch,
  onOpenCopilot
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current active page
  let currentInfo = ROUTE_MAP[location.pathname];
  if (!currentInfo) {
    if (location.pathname.startsWith('/contracts/')) {
      currentInfo = { label: 'Contract Details', icon: FileText };
    } else {
      currentInfo = { label: 'ContractWatch', icon: LayoutDashboard };
    }
  }

  const CurrentIcon = currentInfo.icon;

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-slate-950/75 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between transition-all duration-200">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          title="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">Workspace</span>
          <ChevronRight size={12} className="text-slate-600 hidden sm:inline" />
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 font-semibold shadow-sm">
            <CurrentIcon size={14} className="text-indigo-400" />
            <span className="text-xs tracking-tight">{currentInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Center: Search Command Bar */}
      <div className="hidden md:flex items-center justify-center max-w-md w-full mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span className="group-hover:text-slate-300">Quick search contracts, vendors, docs...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700/60 shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, AI Copilot, Notifications & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          title="Search"
        >
          <Search size={16} />
        </button>

        {/* AI Copilot Quick Trigger */}
        <button
          onClick={onOpenCopilot}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all shadow-sm"
          title="Open ContractWatch AI Copilot"
        >
          <Sparkles size={14} className="text-indigo-400 animate-pulse" />
          <span>Ask Copilot</span>
        </button>

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-950 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            AM
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-200 leading-tight">Alex Mercer</span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Enterprise Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
