import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, RefreshCw, Clock, AlertTriangle,
  ArrowRight, Plus, Calendar, Sparkles, Building2, BarChart2,
  TrendingUp, DollarSign, ChevronRight
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

const STATUS_COLORS = ['#10b981', '#f59e0b', '#06b6d4', '#64748b', '#ef4444'];

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
    name: c.title.length > 16 ? c.title.slice(0, 14) + '…' : c.title,
    days: c.daysUntilExpiry,
  }));

  // Dynamic DB-calculated Copilot Insights
  const insights: { text: string; highlight: string; icon: string }[] = [];
  if (summary) {
    if (summary.renewalDue > 0) {
      insights.push({
        icon: '⚡',
        highlight: `${summary.renewalDue} Contracts`,
        text: 'in active renewal review window. Immediate counterparty negotiation required.'
      });
    }
    if (summary.upcomingRenewalValue > 0) {
      insights.push({
        icon: '💰',
        highlight: formatCurrency(summary.upcomingRenewalValue),
        text: 'committed financial runway expiring within the next 30 calendar days.'
      });
    }
    if (summary.criticalRiskContracts > 0) {
      insights.push({
        icon: '🔴',
        highlight: `${summary.criticalRiskContracts} Critical Risks`,
        text: 'identified by the Risk Scoring Engine due to lapsed review windows.'
      });
    } else {
      insights.push({
        icon: '🛡️',
        highlight: 'Zero Critical Leaks',
        text: 'All active enterprise contracts maintain compliant notice runways.'
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Silky Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-indigo-950/40 to-slate-900/95 border border-indigo-500/20 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Enterprise Renewal Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight">
              {greeting}, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">Alex</span> 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Track vendor commitments, eliminate auto-renew lock-in leaks, and prioritize renewal decisions with AI Copilot.
            </p>
          </div>

          {/* Quick Actions Dock */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setContractModalOpen(true)}
              className="btn btn-primary shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              style={{ padding: '0.65rem 1.35rem', fontSize: '0.875rem' }}
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
              <RefreshCw className="w-3.5 h-3.5" /> Renewals Queue
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="btn btn-secondary flex items-center gap-1.5 text-xs"
            >
              <Calendar className="w-3.5 h-3.5" /> Calendar
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="btn btn-secondary flex items-center gap-1.5 text-xs"
            >
              <BarChart2 className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Silky Copilot Insights Carousel Banner */}
      {insights.length > 0 && (
        <div className="relative rounded-2xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>ContractWatch AI Copilot Insights</span>
            </div>
            <button 
              onClick={() => document.dispatchEvent(new CustomEvent('open-copilot'))}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Ask Copilot Assistant <ChevronRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.map((ins, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/30 rounded-xl p-3.5 transition-all duration-200 cursor-pointer group"
                onClick={() => document.dispatchEvent(new CustomEvent('open-copilot'))}
              >
                <div className="text-xl shrink-0 mt-0.5 p-1.5 rounded-lg bg-slate-900 group-hover:scale-110 transition-transform">
                  {ins.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {ins.highlight}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                    {ins.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Silky Metric Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Portfolio Value */}
          <div 
            className="stat-card"
            style={{ '--accent-color': '#6366f1' } as React.CSSProperties}
            onClick={() => navigate('/contracts')}
          >
            <div className="stat-card-header">
              <span className="stat-card-label">Total Portfolio</span>
              <div className="stat-card-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="stat-card-value font-mono">
              {formatCurrency(summary.totalContractValue)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{summary.totalContracts} registered contracts</span>
              <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                View all <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 2: Active Contracts */}
          <div 
            className="stat-card"
            style={{ '--accent-color': '#10b981' } as React.CSSProperties}
            onClick={() => navigate('/contracts?filter=active')}
          >
            <div className="stat-card-header">
              <span className="stat-card-label">Active Commitments</span>
              <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="stat-card-value text-emerald-400 font-mono">
              {summary.activeContracts}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{formatCurrency(summary.activeContractValue)} live value</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                Active <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 3: Renewal Due */}
          <div 
            className="stat-card"
            style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}
            onClick={() => navigate('/renewals')}
          >
            <div className="stat-card-header">
              <span className="stat-card-label">Renewal Review Due</span>
              <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <RefreshCw className="w-5 h-5" />
              </div>
            </div>
            <div className="stat-card-value text-amber-400 font-mono">
              {summary.renewalDue}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="text-amber-400/90 font-medium">Inside notice window</span>
              <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                Review <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 4: Expiring in 30 Days */}
          <div 
            className="stat-card"
            style={{ '--accent-color': '#f43f5e' } as React.CSSProperties}
            onClick={() => navigate('/contracts?filter=expiring')}
          >
            <div className="stat-card-header">
              <span className="stat-card-label">Expiring in 30 Days</span>
              <div className="stat-card-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="stat-card-value text-rose-400 font-mono">
              {summary.expiringWithin30Days}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{formatCurrency(summary.upcomingRenewalValue)} at risk</span>
              <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                Urgent <ChevronRight size={12} />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution Pie */}
        <div className="lg:col-span-5 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">Status Distribution</h2>
              <p className="text-xs text-slate-400">Real-time breakdown of contract states</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              {summary?.totalContracts} Contracts
            </span>
          </div>

          <div className="h-60 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '0.75rem'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pills */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }}></span>
                <span className="text-slate-400 truncate">{d.name}</span>
                <span className="ml-auto font-mono font-bold text-slate-200">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expiry Runway Chart */}
        <div className="lg:col-span-7 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Upcoming Expiry Horizon
              </h2>
              <p className="text-xs text-slate-400">Days remaining until termination for imminent contracts</p>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Open Calendar <ChevronRight size={12} />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  fontSize={10} 
                  angle={-15} 
                  textAnchor="end" 
                  interval={0}
                />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  formatter={(val: any) => [`${val} days remaining`, 'Horizon']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '0.75rem'
                  }}
                />
                <Bar dataKey="days" fill="#6366F1" radius={[6, 6, 0, 0]} name="Days Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Silky Urgent Action Queue Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Immediate Priority Contracts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Contracts sorted by urgency runway and risk scoring
            </p>
          </div>
          <button
            onClick={() => navigate('/contracts')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            Explore all {summary?.totalContracts} contracts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Contract & Identifier</th>
                <th>Vendor</th>
                <th>End Date</th>
                <th>Runway</th>
                <th>Value</th>
                <th>Risk Engine</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {expiring.slice(0, 5).map(c => {
                const urgency = getUrgencyColor(c.daysUntilExpiry);
                return (
                  <tr 
                    key={c.id} 
                    className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                    onClick={() => navigate(`/contracts/${c.id}`)}
                  >
                    <td>
                      <div className="font-semibold text-slate-200">{c.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.contractNumber}</div>
                    </td>
                    <td className="text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-500" />
                        <span>{c.vendorName}</span>
                      </div>
                    </td>
                    <td className="text-slate-300 font-mono text-xs">{formatDate(c.endDate)}</td>
                    <td>
                      <span className="font-bold text-xs" style={{ color: urgency }}>
                        {getDaysLabel(c.daysUntilExpiry)}
                      </span>
                    </td>
                    <td className="font-mono text-slate-200 font-semibold text-xs">
                      {formatCurrency(c.contractValue, c.currency)}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.riskLevel === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        c.riskLevel === 'HIGH' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        c.riskLevel === 'MEDIUM' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {c.riskLevel || 'LOW'} ({c.riskScore || 0})
                      </span>
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/contracts/${c.id}`);
                        }}
                        className="btn btn-secondary btn-sm text-xs py-1 px-2.5 font-medium hover:text-indigo-400"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
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
      <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-slate-900 rounded-2xl border border-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
      </div>
    </div>
  );
}
