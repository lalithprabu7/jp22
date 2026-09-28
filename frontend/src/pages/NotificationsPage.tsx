import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Check, AlertCircle, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/contractService';
import type { Notification } from '../types';
import { formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';

const ICONS: Record<string, React.ReactNode> = {
  RENEWAL_DUE: <AlertTriangle size={16} color="var(--color-warning)" />,
  EXPIRING_SOON: <Clock size={16} color="var(--color-warning)" />,
  CONTRACT_EXPIRED: <AlertCircle size={16} color="var(--color-danger)" />,
  STATUS_CHANGED: <RefreshCw size={16} color="var(--color-info)" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = () => {
    setLoading(true);
    getNotifications().then(setNotifications).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    fetchNotifications();
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    toast.success('All notifications marked as read.');
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔔 Notifications</h1>
          <p className="page-subtitle">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAll}>
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading notifications…</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={28} /></div>
          <h3>All caught up!</h3>
          <p>No notifications yet. They'll appear here when contract deadlines approach.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notifications.map(n => (
            <div
              key={n.id}
              className="card card-sm"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                opacity: n.read ? 0.65 : 1,
                cursor: n.contractId ? 'pointer' : 'default',
                borderColor: n.read ? 'var(--color-border)' : 'rgba(99,102,241,0.3)',
              }}
              onClick={() => n.contractId && navigate(`/contracts/${n.contractId}`)}
            >
              <div style={{ marginTop: '0.1rem', flexShrink: 0 }}>
                {ICONS[n.type] ?? <Bell size={16} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                {n.contractTitle && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    📄 {n.contractTitle} · #{n.contractNumber}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.3rem' }}>
                  {formatDateTime(n.createdAt)}
                </div>
              </div>
              {!n.read && (
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                  title="Mark as read"
                >
                  <Check size={14} />
                </button>
              )}
              {!n.read && (
                <div className="notif-dot" style={{ alignSelf: 'center', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
