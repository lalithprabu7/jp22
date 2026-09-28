import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle, RefreshCw, Clock, AlertTriangle,
  TrendingUp, ArrowRight
} from 'lucide-react';
import { getDashboardSummary, getExpiringContracts, getRenewalDueContracts } from '../services/contractService';
import type { DashboardSummary, Contract } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate, getDaysLabel, getUrgencyColor } from '../utils/formatters';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#6b7280', '#ef4444'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expiring, setExpiring] = useState<Contract[]>([]);
  const [renewalDue, setRenewalDue] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getExpiringContracts(30),
      getRenewalDueContracts(),
    ]).then(([s, e, r]) => {
      setSummary(s);
      setExpiring(e);
      setRenewalDue(r);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const pieData = summary ? [
    { name: 'Active', value: summary.activeContracts },
    { name: 'Renewal Due', value: summary.renewalDue },
    { name: 'Renewed', value: summary.renewedContracts },
    { name: 'Terminated', value: summary.terminatedContracts },
    { name: 'Expired', value: summary.expiredContracts },
  ].filter(d => d.value > 0) : [];

  const barData = expiring.slice(0, 6).map(c => ({
    name: c.title.length > 20 ? c.title.slice(0, 18) + '…' : c.title,
    days: c.daysUntilExpiry,
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">{greeting} 👋</h1>
        <p className="page-subtitle">Here's your contract overview for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Contracts"
          value={summary?.totalContracts ?? 0}
          icon={<FileText size={20} color="#6366f1" />}
          iconBg="rgba(99,102,241,0.1)"
          accent="var(--color-primary)"
          desc="All contracts in system"
          onClick={() => navigate('/contracts')}
        />
        <StatCard
          label="Active Contracts"
          value={summary?.activeContracts ?? 0}
          icon={<CheckCircle size={20} color="#10b981" />}
          iconBg="rgba(16,185,129,0.1)"
          accent="var(--color-success)"
          desc="Currently active"
          onClick={() => navigate('/contracts')}
        />
        <StatCard
          label="Renewal Due"
          value={summary?.renewalDue ?? 0}
          icon={<RefreshCw size={20} color="#f59e0b" />}
          iconBg="rgba(245,158,11,0.1)"
          accent="var(--color-warning)"
          desc="Require renewal decision"
          onClick={() => navigate('/renewals')}
          urgent
        />
        <StatCard
          label="Expiring in 30 Days"
          value={summary?.expiringWithin30Days ?? 0}
          icon={<Clock size={20} color="#ef4444" />}
          iconBg="rgba(239,68,68,0.1)"
          accent="var(--color-danger)"
          desc="Action recommended"
          onClick={() => navigate('/contracts?filter=expiring')}
          urgent={Boolean(summary && summary.expiringWithin30Days > 0)}
        />
      </div>

      {/* Charts + Timeline Row */}
      <div className="dashboard-grid">
        {/* Renewal Timeline */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>🔔 Renewal Timeline</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/renewals')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          {renewalDue.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <CheckCircle size={32} color="var(--color-success)" />
              <p>No contracts currently in renewal window.</p>
            </div>
          ) : (
            <div className="timeline">
              {renewalDue.slice(0, 5).map(c => (
                <div
                  key={c.id}
                  className="timeline-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/contracts/${c.id}`)}
                >
                  <div
                    className="timeline-dot"
                    style={{ background: getUrgencyColor(c.daysUntilExpiry) + '22', color: getUrgencyColor(c.daysUntilExpiry) }}
                  >
                    <AlertTriangle size={16} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-label">{c.title}</div>
                    <div className="timeline-time">
                      {c.vendorName} · Expires {formatDate(c.endDate)}
                    </div>
                    <div style={{
                      fontSize: '0.75rem', fontWeight: 600, marginTop: '0.2rem',
                      color: getUrgencyColor(c.daysUntilExpiry)
                    }}>
                      {getDaysLabel(c.daysUntilExpiry)} remaining
                    </div>
                  </div>
                  <div style={{ alignSelf: 'center' }}>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Distribution Pie */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            📊 Contract Status Distribution
          </h3>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-secondary)' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
        {/* Expiring Contracts Bar Chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            📅 Contracts Expiring Within 30 Days
          </h3>
          {barData.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <TrendingUp size={32} color="var(--color-success)" />
              <p>No contracts expiring in the next 30 days.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  angle={-30} textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  formatter={(v) => [`${v} days`, 'Days Remaining']}
                />
                <Bar dataKey="days" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Urgent Contracts */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>⚠️ Urgent Attention Required</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/contracts')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          {expiring.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <CheckCircle size={32} color="var(--color-success)" />
              <p>No urgent contracts. All looks healthy!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {expiring.slice(0, 5).map(c => {
                const urgencyColor = getUrgencyColor(c.daysUntilExpiry);
                return (
                  <div
                    key={c.id}
                    className="card card-sm"
                    style={{ cursor: 'pointer', borderColor: urgencyColor + '33' }}
                    onClick={() => navigate(`/contracts/${c.id}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }} className="truncate">{c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.vendorName}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: urgencyColor }}>
                          {getDaysLabel(c.daysUntilExpiry)}
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                    <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, Math.max(5, ((30 - c.daysUntilExpiry) / 30) * 100))}%`,
                          background: urgencyColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  accent: string;
  desc: string;
  onClick?: () => void;
  urgent?: boolean;
}

function StatCard({ label, value, icon, iconBg, accent, desc, onClick, urgent }: StatCardProps) {
  return (
    <div
      className={`stat-card ${urgent && value > 0 ? 'animate-pulse' : ''}`}
      style={{ ['--accent-color' as string]: accent, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" style={{ ['--icon-bg' as string]: iconBg }}>
          {icon}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-desc">{desc}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: 40, width: 200, marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ height: 20, width: 280, marginBottom: '2rem' }} />
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ height: 120 }}>
            <div className="skeleton" style={{ height: '100%', borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
