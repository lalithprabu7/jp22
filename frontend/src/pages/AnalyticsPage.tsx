import { useEffect, useState } from 'react';
import { 
  BarChart2, TrendingUp, DollarSign, Clock, ShieldAlert, 
  Download, PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend, CartesianGrid 
} from 'recharts';
import { 
  getAnalyticsStatus, getAnalyticsExpiry, getAnalyticsVendors, 
  getAnalyticsRisk, getAnalyticsMetrics, getExportContractsUrl, 
  getExportRenewalsUrl, getExportRisksUrl 
} from '../services/contractService';
import type { 
  StatusDistribution, MonthlyExpiry, VendorShare, 
  RiskDistribution, PortfolioMetrics 
} from '../types';
import { formatCurrency } from '../utils/formatters';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10B981',       // Emerald
  RENEWAL_DUE: '#F59E0B',  // Amber
  RENEWED: '#06B6D4',      // Cyan
  TERMINATED: '#F43F5E',   // Rose
  EXPIRED: '#64748B'       // Slate
};

const RISK_COLORS: Record<string, string> = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444'
};

export const AnalyticsPage = () => {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [statusData, setStatusData] = useState<StatusDistribution[]>([]);
  const [expiryData, setExpiryData] = useState<MonthlyExpiry[]>([]);
  const [vendorData, setVendorData] = useState<VendorShare[]>([]);
  const [riskData, setRiskData] = useState<RiskDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [m, s, e, v, r] = await Promise.all([
        getAnalyticsMetrics(),
        getAnalyticsStatus(),
        getAnalyticsExpiry(),
        getAnalyticsVendors(),
        getAnalyticsRisk()
      ]);
      setMetrics(m);
      setStatusData(s);
      setExpiryData(e);
      setVendorData(v);
      setRiskData(r);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Crunching real-time contract intelligence...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Header & Export Actions */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: 32, height: 32, borderRadius: '10px', 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8'
            }}>
              <BarChart2 size={18} />
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-light)' }}>
              Executive Intelligence
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800 }}>Portfolio Analytics</h1>
          <p className="page-subtitle">
            Financial exposure modeling, expiration forecasts, risk tier distribution, and vendor concentration metrics.
          </p>
        </div>

        {/* Export Data Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <a
            href={getExportContractsUrl()}
            download
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            <Download size={14} /> Contracts CSV
          </a>
          <a
            href={getExportRenewalsUrl()}
            download
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            <Download size={14} /> Renewals CSV
          </a>
          <a
            href={getExportRisksUrl()}
            download
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            <Download size={14} /> Risk Audit CSV
          </a>
        </div>
      </div>

      {/* KPI Cards Strip */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Portfolio Value</span>
              <span style={{ 
                width: 32, height: 32, borderRadius: '8px', 
                background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <DollarSign size={16} />
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem', letterSpacing: '-0.02em' }}>
              {formatCurrency(metrics.totalContractValue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
              Across {metrics.totalContracts} managed vendor agreements
            </div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Value At Play</span>
              <span style={{ 
                width: 32, height: 32, borderRadius: '8px', 
                background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <TrendingUp size={16} />
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.4rem', letterSpacing: '-0.02em' }}>
              {formatCurrency(metrics.activeContractValue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
              Live ongoing counterparty commitments
            </div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Renewal Rate</span>
              <span style={{ 
                width: 32, height: 32, borderRadius: '8px', 
                background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <Clock size={16} />
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#818cf8', marginTop: '0.4rem', letterSpacing: '-0.02em' }}>
              {metrics.renewalRatePercentage}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
              Avg agreement term: ~{metrics.avgDurationMonths} months
            </div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>High Risk Flags</span>
              <span style={{ 
                width: 32, height: 32, borderRadius: '8px', 
                background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <ShieldAlert size={16} />
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f87171', marginTop: '0.4rem', letterSpacing: '-0.02em' }}>
              {metrics.criticalCount + metrics.highRiskCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
              {metrics.criticalCount} Critical &bull; {metrics.highRiskCount} High urgency
            </div>
          </div>
        </div>
      )}

      {/* Row 1 Charts: Status & Risk Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
        {/* Status Breakdown Pie */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Lifecycle Status Distribution
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Active vs Renewing vs Expired contract volume
              </p>
            </div>
            <span style={{ 
              width: 30, height: 30, borderRadius: '8px', 
              background: 'rgba(255, 255, 255, 0.05)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' 
            }}>
              <PieIcon size={16} />
            </span>
          </div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={55}
                  paddingAngle={4}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6366F1'} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderColor: 'rgba(99, 102, 241, 0.3)', 
                    borderRadius: '12px', color: '#f8fafc',
                    boxShadow: '0 12px 24px -4px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Automated Risk Tier Breakdown
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Classification based on expiry proximity & value exposure
              </p>
            </div>
            <span style={{ 
              width: 30, height: 30, borderRadius: '8px', 
              background: 'rgba(255, 255, 255, 0.05)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' 
            }}>
              <ShieldAlert size={16} />
            </span>
          </div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="count"
                  nameKey="riskLevel"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={55}
                  paddingAngle={4}
                  label={({ name, value }: { name?: string; value?: number }) => `${name || ''}: ${value || 0}`}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.riskLevel] || '#6366F1'} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderColor: 'rgba(99, 102, 241, 0.3)', 
                    borderRadius: '12px', color: '#f8fafc',
                    boxShadow: '0 12px 24px -4px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Expiration Forecast & Vendor Spend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
        {/* Monthly Expiry Forecast */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                12-Month Forward Expiration Runway
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Forecasted contract maturities by calendar month
              </p>
            </div>
            <span style={{ 
              width: 30, height: 30, borderRadius: '8px', 
              background: 'rgba(255, 255, 255, 0.05)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' 
            }}>
              <Clock size={16} />
            </span>
          </div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderColor: 'rgba(99, 102, 241, 0.3)', 
                    borderRadius: '12px', color: '#f8fafc',
                    boxShadow: '0 12px 24px -4px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Bar dataKey="count" fill="url(#blueIndigoGradient)" radius={[6, 6, 0, 0]} name="Expiring Contracts" />
                <defs>
                  <linearGradient id="blueIndigoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vendors by Commitment */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Vendor Concentration & Exposure
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Committed financial value allocated by primary counterparty
              </p>
            </div>
            <span style={{ 
              width: 30, height: 30, borderRadius: '8px', 
              background: 'rgba(255, 255, 255, 0.05)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' 
            }}>
              <DollarSign size={16} />
            </span>
          </div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={10} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} tickLine={false} />
                <YAxis dataKey="vendorName" type="category" stroke="#64748B" fontSize={11} width={110} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val || 0))}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderColor: 'rgba(16, 185, 129, 0.3)', 
                    borderRadius: '12px', color: '#f8fafc',
                    boxShadow: '0 12px 24px -4px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Bar dataKey="totalValue" fill="url(#emeraldTealGradient)" radius={[0, 6, 6, 0]} name="Committed Value" />
                <defs>
                  <linearGradient id="emeraldTealGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
