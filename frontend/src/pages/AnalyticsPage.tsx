import { useEffect, useState } from 'react';
import { 
  BarChart2, TrendingUp, DollarSign, Clock, ShieldAlert, 
  Download, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend 
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
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm font-medium">Crunching portfolio contract data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-indigo-400" />
            Executive Contract Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time financial exposure, risk classification, and expiration forecasting across active vendors.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={getExportContractsUrl()}
            download
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Contracts CSV
          </a>
          <a
            href={getExportRenewalsUrl()}
            download
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Renewals CSV
          </a>
          <a
            href={getExportRisksUrl()}
            download
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Risk Report CSV
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Portfolio Value</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              {formatCurrency(metrics.totalContractValue)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Across {metrics.totalContracts} managed vendor contracts
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Commitments</span>
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-cyan-400">
              {formatCurrency(metrics.activeContractValue)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Live contracts & active review windows
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Historical Renewal Rate</span>
              <Clock className="w-5 h-5 text-teal-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-teal-400">
              {metrics.renewalRatePercentage}%
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Avg duration: ~{metrics.avgDurationMonths} months
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Elevated Risk Contracts</span>
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-400">
              {metrics.criticalCount + metrics.highRiskCount}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {metrics.criticalCount} Critical • {metrics.highRiskCount} High Risk
            </div>
          </div>
        </div>
      )}

      {/* Row 1 Charts: Status & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Pie */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-100 mb-1">Contract Status Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">Breakdown of contract counts across lifecycle stages</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6366F1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-100 mb-1">Renewal Risk Tier Breakdown</h2>
          <p className="text-xs text-slate-400 mb-4">Portfolio contracts categorized by automated risk engine</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="count"
                  nameKey="riskLevel"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, value }: { name?: string; value?: number }) => `${name || ''}: ${value || 0}`}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.riskLevel] || '#6366F1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Expiration Forecast & Vendor Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expiry Forecast */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-100 mb-1">12-Month Forward Expiration Forecast</h2>
          <p className="text-xs text-slate-400 mb-4">Number of contracts expiring each month</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryData}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Expiring Contracts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vendors by Commitment */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-100 mb-1">Top Vendor Financial Exposure</h2>
          <p className="text-xs text-slate-400 mb-4">Total committed financial value by primary vendor</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorData} layout="vertical">
                <XAxis type="number" stroke="#64748B" fontSize={10} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} />
                <YAxis dataKey="vendorName" type="category" stroke="#64748B" fontSize={11} width={100} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val || 0))}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                />
                <Bar dataKey="totalValue" fill="#10B981" radius={[0, 4, 4, 0]} name="Committed Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
