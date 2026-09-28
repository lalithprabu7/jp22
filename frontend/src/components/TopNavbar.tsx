import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Sparkles, 
  Menu, LayoutDashboard, FileText, 
  RefreshCw, Calendar, BarChart3, Building2, FolderOpen,
  Settings
} from 'lucide-react';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  unreadCount: number;
  onOpenSearch: () => void;
  onOpenCopilot: () => void;
}

const ROUTE_MAP: Record<string, { label: string; icon: React.ComponentType<{ size: number; className?: string }> }> = {
  '/': { label: 'Command Center', icon: LayoutDashboard },
  '/contracts': { label: 'Contract Registry', icon: FileText },
  '/renewals': { label: 'Renewal Queue', icon: RefreshCw },
  '/calendar': { label: 'Master Schedule', icon: Calendar },
  '/analytics': { label: 'Intelligence', icon: BarChart3 },
  '/vendors': { label: 'Vendor Ecosystem', icon: Building2 },
  '/documents': { label: 'Data Room', icon: FolderOpen },
  '/notifications': { label: 'Alerts', icon: Bell },
  '/settings': { label: 'Configuration', icon: Settings },
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  unreadCount,
  onOpenSearch,
  onOpenCopilot
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  let currentInfo = ROUTE_MAP[location.pathname];
  if (!currentInfo) {
    if (location.pathname.startsWith('/contracts/')) {
      currentInfo = { label: 'Contract Deep Dive', icon: FileText };
    } else {
      currentInfo = { label: 'ContractWatch', icon: LayoutDashboard };
    }
  }

  const CurrentIcon = currentInfo.icon;

  return (
    <div className="sticky top-0 z-40 w-full px-4 sm:px-8 pt-4 pb-2 bg-transparent pointer-events-none">
      <header className="pointer-events-auto h-14 bg-[#0c101b]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] px-4 flex items-center justify-between shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
        
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={16} />
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium shadow-sm">
              <CurrentIcon size={14} className="text-indigo-400" />
              <span className="text-[13px] tracking-tight">{currentInfo.label}</span>
            </div>
            {/* Mobile simplified breadcrumb */}
            <div className="sm:hidden flex items-center gap-2 text-indigo-300 font-medium">
              <CurrentIcon size={16} />
              <span className="text-sm tracking-tight truncate max-w-[120px]">{currentInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-400 text-sm transition-all shadow-inner group"
          >
            <div className="flex items-center gap-2">
              <Search size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <span className="group-hover:text-slate-200">Search globally...</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded-lg bg-black/40 text-[10px] font-mono font-bold text-slate-300 border border-white/5">⌘</kbd>
              <kbd className="px-2 py-0.5 rounded-lg bg-black/40 text-[10px] font-mono font-bold text-slate-300 border border-white/5">K</kbd>
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
          >
            <Search size={16} />
          </button>

          <button
            onClick={onOpenCopilot}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] group"
          >
            <Sparkles size={14} className="text-purple-400 group-hover:animate-pulse" />
            <span className="text-[13px] font-semibold">Insights</span>
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.6)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

          <button 
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 p-[2px] cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-full h-full rounded-full bg-[#0c101b] flex items-center justify-center overflow-hidden border border-[#0c101b]">
              <span className="text-[11px] font-bold text-white tracking-wider">AM</span>
            </div>
          </button>
        </div>
      </header>
    </div>
  );
};

export default TopNavbar;
