import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCheck, Check, AlertCircle, RefreshCw, 
  Clock, AlertTriangle, Trash2
} from 'lucide-react';
import { 
  getNotifications, markNotificationRead, markAllNotificationsRead, clearReadNotifications 
} from '../services/contractService';
import type { Notification } from '../types';
import { formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';

const ICONS: Record<string, React.ReactNode> = {
  RENEWAL_DUE: <AlertTriangle size={16} className="text-amber-400" />,
  EXPIRING_SOON: <Clock size={16} className="text-amber-400" />,
  URGENT: <AlertTriangle size={16} className="text-rose-400" />,
  CONTRACT_EXPIRED: <AlertCircle size={16} className="text-rose-400" />,
  STATUS_CHANGED: <RefreshCw size={16} className="text-indigo-400" />,
};

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

  useEffect(() => { 
    fetchNotifications(); 
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: number) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await markNotificationRead(id);
      document.dispatchEvent(new CustomEvent('notifications-updated'));
      toast.success('Notification marked as read');
    } catch {
      fetchNotifications();
    }
  };

  const handleMarkAll = async () => {
    try {
      // Optimistically mark all as read locally
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await markAllNotificationsRead();
      document.dispatchEvent(new CustomEvent('notifications-updated'));
      toast.success('All notifications marked as read.');
    } catch {
      fetchNotifications();
    }
  };

  const handleClearRead = async () => {
    try {
      setNotifications(prev => prev.filter(n => !n.read));
      await clearReadNotifications();
      document.dispatchEvent(new CustomEvent('notifications-updated'));
      toast.success('Read notifications cleared.');
    } catch {
      fetchNotifications();
    }
  };

  const displayedNotifications = filterMode === 'UNREAD' 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-400" />
            Notifications Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount === 0 
              ? 'All caught up! Zero unread contract alerts.' 
              : `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''} require attention.`}
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md shadow-indigo-600/20" 
              onClick={handleMarkAll}
            >
              <CheckCheck size={15} /> Mark All as Read
            </button>
          )}
          {notifications.some(n => n.read) && (
            <button 
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400"
              onClick={handleClearRead}
              title="Delete already read notifications"
            >
              <Trash2 size={14} /> Clear Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setFilterMode('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filterMode === 'ALL'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterMode('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filterMode === 'UNREAD'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Unread Only
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          Loading notifications...
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCheck size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            {filterMode === 'UNREAD' ? 'No unread notifications' : 'No notifications'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filterMode === 'UNREAD' 
              ? 'Great job! You have addressed all renewal and expiry alerts.' 
              : 'New contract renewal alerts, review windows, and expiry warnings will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedNotifications.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                n.read 
                  ? 'bg-slate-900/30 border-slate-800/60 opacity-60 hover:opacity-90' 
                  : 'bg-slate-900/80 border-indigo-500/40 shadow-sm'
              }`}
            >
              <div 
                className="flex items-start gap-3 flex-1 cursor-pointer"
                onClick={() => n.contractId && navigate(`/contracts/${n.contractId}`)}
              >
                <div className="p-2 rounded-lg bg-slate-800/80 shrink-0 mt-0.5">
                  {ICONS[n.type] ?? <Bell size={16} className="text-slate-400" />}
                </div>
                <div>
                  <div className={`text-sm leading-snug ${n.read ? 'text-slate-300 font-normal' : 'text-slate-100 font-semibold'}`}>
                    {n.message}
                  </div>
                  {n.contractTitle && (
                    <div className="text-xs text-indigo-400 font-medium mt-1 hover:underline">
                      📄 {n.contractTitle} {n.contractNumber ? `(${n.contractNumber})` : ''}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    {formatDateTime(n.createdAt)}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!n.read ? (
                  <button
                    className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium flex items-center gap-1 transition-colors border border-indigo-500/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(n.id);
                    }}
                    title="Mark as read"
                  >
                    <Check size={14} />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 px-2 py-0.5">
                    <Check size={12} className="text-emerald-500" /> Read
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
