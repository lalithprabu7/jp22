import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle, RefreshCw, Clock, AlertTriangle,
  ArrowRight, Plus, Calendar,
  Sparkles, Building2, BarChart2
} from 'lucide-react';
import { getDashboardSummary, getExpiringContracts } from '../services/contractService';
import type { DashboardSummary, Contract } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate, getDaysLabel, getUrgencyColor, formatCurrency } from '../utils/formatters';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';
import ContractFormModal from '../components/ContractFormModal';

const COLORS = ['#10b981', '#f59e0b', '#06b6d4', '#64748b', '#ef4444'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expiring, setExpiring] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([
      getDashboardSummary(),
      getExpiringContracts(30),
    ]).then(([s, e]) => {
      setSummary(s);
      setExpiring(e);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
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
    name: c.title.length > 18 ? c.title.slice(0, 16) + '…' : c.title,
    days: c.daysUntilExpiry,
  }));

  // Dynamic DB-calculated Copilot Insights
  const insights: { text: string; highlight: string; icon: string }[] = [];
  if (summary) {
    if (summary.renewalDue > 0) {
      insights.push({
        icon: '⚡',
        highlight: `${summary.renewalDue} contracts`,
        text: 'currently need renewal review decisions before notice windows close.'
      });
    }
    if (summary.upcomingRenewalValue > 0) {
      insights.push({
        icon: '💰',
        highlight: formatCurrency(summary.upcomingRenewalValue),
        text: 'worth of vendor commitments are expiring within the next 30 days.'
      });
    }
    if (summary.criticalRiskContracts > 0) {
      insights.push({
        icon: '🔴',
        highlight: `${summary.criticalRiskContracts} contracts`,
        text: 'are flagged as Critical Risk due to immediate expiration deadlines.'
      });
    } else {
      insights.push({
        icon: '🛡️',
        highlight: 'Zero Critical Leaks',
        text: 'All active contracts maintain healthy documentation and compliance.'
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
            {greeting} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">Here's your contract overview and renewal priorities for today.</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setContractModalOpen(true)}
            className="btn btn-primary shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" /> Add Contract
          </button>
          <button
            onClick={() => navigate('/vendors')}
            className="btn btn-secondary flex items-center gap-1.5 text-xs"
          >
            <Building2 className="w-3.5 h-3.5" /> Add Vendor
          </button>
          <button
            onClick={() => navigate('/renewals')}
            className="btn btn-secondary flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Review Renewals
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="btn btn-secondary flex items-center gap-1.5 text-xs"
          >
            <Calendar className="w-3.5 h-3.5" /> View Calendar
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="btn btn-secondary flex items-center gap-1.5 text-xs"
          >
            <BarChart2 className="w-3.5 h-3.5" /> Analytics
          </button>
        </div>
      </div>

      {/* Copilot Insights Banner */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-2.5">
            <Sparkles className="w-4 h-4" /> Copilot Portfolio Insights
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 bg-slate-900/80 border border-indigo-500/20 rounded-xl p-3">
                <span className="text-base shrink-0 mt-0.5">{ins.icon}</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-slate-100">{ins.highlight}</strong> {ins.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Contracts</span>
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100">{summary.totalContracts}</div>
            <div className="mt-1 text-xs text-slate-400">{formatCurrency(summary.totalContractValue)} total commitment</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">{summary.activeContracts}</div>
            <div className="mt-1 text-xs text-slate-400">{formatCurrency(summary.activeContractValue)} live value</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Renewal Due</span>
              <RefreshCw className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-400">{summary.renewalDue}</div>
            <div className="mt-1 text-xs text-amber-400/80">Action required before notice closes</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Expiring in 30 Days</span>
              <Clock className="w-5 h-5 text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-400">{summary.expiringWithin30Days}</div>
            <div className="mt-1 text-xs text-slate-400">{formatCurrency(summary.upcomingRenewalValue)} expiring value</div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Status Distribution</h2>
              <p className="text-xs text-slate-400">Live breakdown of contract lifecycle states</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{summary?.totalContracts} total</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={40}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Days Until Expiry Bar Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Days Remaining (Next 30 Days)</h2>
              <p className="text-xs text-slate-400">Contracts requiring immediate renewal or renegotiation</p>
            </div>
            <button 
              onClick={() => navigate('/renewals')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Review queue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-56">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                  />
                  <Bar dataKey="days" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Days Remaining" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                No contracts expiring within the next 30 days!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Urgent Contracts & Renewal Queue Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Urgent Contracts Requiring Action
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Top contracts ordered by expiration deadline urgency</p>
          </div>
          <button
            onClick={() => navigate('/contracts')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            View all ({summary?.totalContracts}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Vendor</th>
                <th>End Date</th>
                <th>Days Remaining</th>
                <th>Value</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {expiring.slice(0, 5).map(c => (
                <tr 
                  key={c.id} 
                  className="cursor-pointer hover:bg-slate-800/60"
                  onClick={() => navigate(`/contracts/${c.id}`)}
                >
                  <td>
                    <div className="font-medium text-slate-200">{c.title}</div>
                    <div className="text-xs text-slate-400 font-mono">{c.contractNumber}</div>
                  </td>
                  <td className="text-slate-300">{c.vendorName}</td>
                  <td className="text-slate-300">{formatDate(c.endDate)}</td>
                  <td>
                    <span className={`font-semibold ${getUrgencyColor(c.daysUntilExpiry)}`}>
                      {getDaysLabel(c.daysUntilExpiry)}
                    </span>
                  </td>
                  <td className="font-mono text-slate-300">{formatCurrency(c.contractValue)}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      c.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                      c.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                      c.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {c.riskLevel || 'LOW'}
                    </span>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/contracts/${c.id}`);
                      }}
                      className="btn-secondary text-xs py-1 px-2.5"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Form Modal */}
      {contractModalOpen && (
        <ContractFormModal
          onClose={() => setContractModalOpen(false)}
          onSuccess={() => {
            setContractModalOpen(false);
            loadDashboard();
          }}
        />
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-slate-800 rounded w-1/4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-slate-800 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}
