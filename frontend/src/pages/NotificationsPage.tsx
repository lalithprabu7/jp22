import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCheck, Check, AlertCircle, RefreshCw, 
  Clock, AlertTriangle, Trash2, FileText
} from 'lucide-react';
import { 
  getNotifications, markNotificationRead, markAllNotificationsRead, clearReadNotifications 
} from '../services/contractService';
import type { Notification } from '../types';
import { formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';

type NotifType = 'RENEWAL_DUE' | 'EXPIRING_SOON' | 'URGENT' | 'CONTRACT_EXPIRED' | 'STATUS_CHANGED' | string;

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  RENEWAL_DUE:       { icon: <RefreshCw size={15} />,    color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  label: 'Renewal Due' },
  EXPIRING_SOON:     { icon: <Clock size={15} />,         color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  label: 'Expiring Soon' },
  URGENT:            { icon: <AlertTriangle size={15} />, color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   label: 'Urgent' },
  CONTRACT_EXPIRED:  { icon: <AlertCircle size={15} />,   color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   label: 'Expired' },
  STATUS_CHANGED:    { icon: <RefreshCw size={15} />,     color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', label: 'Status Update' },
};

const DEFAULT_TYPE_CONFIG = { icon: <Bell size={15} />, color: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10', label: 'Alert' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const list = await getNotifications();
      setNotifications(list);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  const handleMarkRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await markNotificationRead(id);
      document.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch {
      fetchNotifications();
    }
  };

  const handleMarkAll = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
      document.dispatchEvent(new CustomEvent('notifications-updated'));
      toast.success('All marked as read');
    } catch {
      fetchNotifications();
    }
  };

  const handleClearRead = async () => {
    setNotifications(prev => prev.filter(n => !n.read));
    try {
      await clearReadNotifications();
      document.dispatchEvent(new CustomEvent('notifications-updated'));
      toast.success('Read notifications cleared');
    } catch {
      fetchNotifications();
    }
  };

  const displayed = filterMode === 'UNREAD'
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="relative w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                  {unreadCount}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Notifications</h1>
          </div>
          <p className="text-sm text-slate-400 ml-[52px]">
            {unreadCount === 0
              ? 'All caught up — zero unread alerts.'
              : `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''} need your attention.`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-[0_0_16px_rgba(99,102,241,0.25)]"
            >
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}
          {readCount > 0 && (
            <button
              onClick={handleClearRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 text-sm font-medium transition-all"
            >
              <Trash2 size={15} /> Clear Read
            </button>
          )}
        </div>
      </div>

      {/* ─── Stats Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: notifications.length, color: 'text-white', dot: '#6366f1' },
          { label: 'Unread', value: unreadCount, color: 'text-rose-400', dot: '#f43f5e' },
          { label: 'Read', value: readCount, color: 'text-emerald-400', dot: '#10b981' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-[#0c101b] border border-white/5 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-widest font-bold mb-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
              {s.label}
            </div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ─── Filter Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-[#0c101b] border border-white/5 rounded-xl w-fit">
        {[
          { label: `All  (${notifications.length})`, value: 'ALL' as const },
          { label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`, value: 'UNREAD' as const },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterMode(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterMode === tab.value
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Notification Feed ──────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-400" />
          <p className="text-sm text-slate-500">Loading notifications…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-4 rounded-2xl bg-[#0c101b] border border-white/5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCheck size={28} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">
              {filterMode === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              {filterMode === 'UNREAD'
                ? 'All alerts have been addressed.'
                : 'Contract renewal alerts, expiry warnings, and status changes will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(n => {
            const cfg = TYPE_CONFIG[n.type as NotifType] ?? DEFAULT_TYPE_CONFIG;
            return (
              <div
                key={n.id}
                className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                  n.read
                    ? 'bg-[#0a0d16] border-white/[0.04] opacity-60 hover:opacity-90'
                    : 'bg-[#0c101b] border-white/[0.08] hover:border-indigo-500/20 shadow-md'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${cfg.bg} ${cfg.border} ${cfg.color} mt-0.5`}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => n.contractId && navigate(`/contracts/${n.contractId}`)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[11px] text-slate-600 font-mono shrink-0">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${n.read ? 'text-slate-400 font-normal' : 'text-slate-100 font-medium'}`}>
                    {n.message}
                  </p>
                  {n.contractTitle && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                      <FileText size={12} />
                      {n.contractTitle}
                      {n.contractNumber && <span className="text-slate-600 font-mono">({n.contractNumber})</span>}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0 flex items-center gap-1 mt-1">
                  {!n.read ? (
                    <button
                      onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold transition-all"
                      title="Mark as read"
                    >
                      <Check size={13} />
                      <span className="hidden sm:inline">Read</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 text-slate-600 text-[11px]">
                      <Check size={12} className="text-emerald-600" /> Read
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
