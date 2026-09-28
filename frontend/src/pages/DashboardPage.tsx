import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, RefreshCw, AlertTriangle,
  ArrowRight, Plus, Calendar, Sparkles, Building2,
  TrendingUp, DollarSign, ChevronRight, Activity,
  Zap, PieChart as PieIcon, AlertOctagon, FileText
} from 'lucide-react';
import { getDashboardSummary, getExpiringContracts } from '../services/contractService';
import type { DashboardSummary, Contract } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate, getDaysLabel, getUrgencyColor, formatCurrency } from '../utils/formatters';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import ContractFormModal from '../components/ContractFormModal';

const STATUS_COLORS = ['#10b981', '#f59e0b', '#0ea5e9', '#64748b', '#ef4444'];

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

  const areaData = expiring.slice(0, 7).map(c => ({
    name: c.title.length > 12 ? c.title.slice(0, 10) + '…' : c.title,
    days: c.daysUntilExpiry,
    value: c.contractValue
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Ultra-Premium Hero Section ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[#090b14] border border-white/[0.08] p-8 md:p-12 shadow-2xl">
        {/* Animated Background Mesh & Gradients */}
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 left-1/4 -mb-24 w-80 h-80 bg-blue-500/10 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 -ml-24 w-64 h-64 bg-purple-500/15 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest">Enterprise Command Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
              {greeting}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300">Lalith</span>
            </h1>
            <p className="text-base md:text-lg text-slate-400 leading-relaxed font-light">
              You have <strong className="text-white font-medium">{summary?.renewalDue} contracts</strong> requiring renewal review. Your active portfolio value is <strong className="text-white font-medium">{formatCurrency(summary?.activeContractValue || 0)}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-copilot'))}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" /> Ask Copilot
            </button>
            <button
              onClick={() => setContractModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(79,70,229,0.3)]"
            >
              <Plus className="w-4 h-4" /> New Contract
            </button>
          </div>
        </div>
      </div>

      {/* ─── Bento Box Grid Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        
        {/* Metric 1: Total Portfolio (Spans 2 cols) */}
        <div 
          className="xl:col-span-2 md:col-span-2 group relative overflow-hidden rounded-[1.5rem] bg-[#0c101b] border border-white/5 p-6 hover:border-indigo-500/30 transition-colors cursor-pointer shadow-lg"
          onClick={() => navigate('/contracts')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <DollarSign className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                <TrendingUp size={12} /> +12.5%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Total Portfolio Value</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{formatCurrency(summary?.totalContractValue || 0)}</h3>
              <p className="text-xs text-slate-500 mt-3 flex items-center justify-between">
                <span>Across {summary?.totalContracts} contracts</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Contracts (Spans 2 cols) */}
        <div 
          className="xl:col-span-2 md:col-span-1 group relative overflow-hidden rounded-[1.5rem] bg-[#0c101b] border border-white/5 p-6 hover:border-emerald-500/30 transition-colors cursor-pointer shadow-lg"
          onClick={() => navigate('/contracts?filter=active')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <Activity className="w-5 h-5 text-emerald-400/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Active Commitments</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{summary?.activeContracts}</h3>
              <p className="text-xs text-slate-500 mt-3 flex items-center justify-between">
                <span>Healthy Status</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>
        </div>

        {/* Metric 3: Renewal Due & Risk (Spans 2 cols) */}
        <div className="xl:col-span-2 md:col-span-1 flex flex-col gap-6">
          <div 
            className="flex-1 group relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-amber-500/10 to-[#0c101b] border border-amber-500/20 p-5 hover:border-amber-500/40 transition-colors cursor-pointer flex items-center justify-between"
            onClick={() => navigate('/renewals')}
          >
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-1">Action Required</p>
              <h4 className="text-xl font-bold text-white">{summary?.renewalDue} Renewals</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
              <RefreshCw className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div 
            className="flex-1 group relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-rose-500/10 to-[#0c101b] border border-rose-500/20 p-5 hover:border-rose-500/40 transition-colors cursor-pointer flex items-center justify-between"
            onClick={() => navigate('/contracts?filter=expiring')}
          >
            <div>
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-1">Critical Risk</p>
              <h4 className="text-xl font-bold text-white">{summary?.criticalRiskContracts || 0} Contracts</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Chart 1: Runway Area Chart (Spans 4 cols) */}
        <div className="xl:col-span-4 lg:col-span-4 rounded-[1.5rem] bg-[#0c101b] border border-white/5 p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" /> Expiry Runway Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-1">Days remaining for upcoming critical contracts</p>
            </div>
            <button onClick={() => navigate('/calendar')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
              <Calendar size={18} />
            </button>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#c7d2fe' }}
                />
                <Area type="monotone" dataKey="days" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDays)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Distribution (Spans 2 cols) */}
        <div className="xl:col-span-2 lg:col-span-4 rounded-[1.5rem] bg-[#0c101b] border border-white/5 p-6 shadow-lg flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-cyan-400" /> Portfolio Mix
            </h3>
          </div>
          <div className="flex-1 relative flex items-center justify-center min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{summary?.totalContracts}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length], color: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                <span className="text-slate-300 truncate font-medium">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Table (Spans full 6 cols) */}
        <div className="xl:col-span-6 rounded-[1.5rem] bg-[#0c101b] border border-white/5 p-6 md:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Action Required Feed
              </h3>
              <p className="text-sm text-slate-400 mt-1">Contracts requiring immediate attention based on intelligent risk scoring.</p>
            </div>
            <button
              onClick={() => navigate('/contracts')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              View Full Directory <ArrowRight size={16} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contract Details</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vendor</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Deadline</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Value</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {expiring.slice(0, 5).map(c => {
                  const urgency = getUrgencyColor(c.daysUntilExpiry);
                  return (
                    <tr 
                      key={c.id} 
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => navigate(`/contracts/${c.id}`)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{c.title}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{c.contractNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                          <Building2 size={14} className="text-slate-500" />
                          {c.vendorName}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-200 font-medium">{formatDate(c.endDate)}</span>
                          <span className="text-xs font-bold mt-0.5" style={{ color: urgency }}>
                            {getDaysLabel(c.daysUntilExpiry)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold text-slate-200 font-mono">
                          {formatCurrency(c.contractValue, c.currency)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500 hover:text-white text-slate-400 transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
    <div className="space-y-6 animate-pulse pb-12">
      <div className="h-64 bg-[#0c101b] rounded-[2rem] border border-white/5" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <div className="xl:col-span-2 h-40 bg-[#0c101b] rounded-[1.5rem] border border-white/5" />
        <div className="xl:col-span-2 h-40 bg-[#0c101b] rounded-[1.5rem] border border-white/5" />
        <div className="xl:col-span-2 h-40 bg-[#0c101b] rounded-[1.5rem] border border-white/5" />
        <div className="xl:col-span-4 h-80 bg-[#0c101b] rounded-[1.5rem] border border-white/5" />
        <div className="xl:col-span-2 h-80 bg-[#0c101b] rounded-[1.5rem] border border-white/5" />
      </div>
    </div>
  );
}
