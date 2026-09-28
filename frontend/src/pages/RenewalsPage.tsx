import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, XCircle, Clock,
  Building2, CheckCircle2, AlertTriangle, ChevronRight,
  DollarSign, Calendar
} from 'lucide-react';
import {
  getRenewalDueContracts, getExpiringContracts, renewContract, terminateContract
} from '../services/contractService';
import type { Contract } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate, getDaysLabel, getUrgencyColor, formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function RenewalsPage() {
  const [renewalDue, setRenewalDue] = useState<Contract[]>([]);
  const [expiring, setExpiring] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [renewModal, setRenewModal] = useState<Contract | null>(null);
  const [termModal, setTermModal] = useState<Contract | null>(null);
  const [renewDate, setRenewDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    Promise.all([getRenewalDueContracts(), getExpiringContracts(30)])
      .then(([rd, ex]) => {
        setRenewalDue(rd);
        setExpiring(ex.filter(c => !rd.find(r => r.id === c.id)));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRenew = async () => {
    if (!renewModal || !renewDate) { toast.error('Select a new end date.'); return; }
    setProcessing(renewModal.id);
    try {
      await renewContract(renewModal.id, { newEndDate: renewDate, remarks });
      toast.success('Contract renewed!');
      setRenewModal(null); setRenewDate(''); setRemarks('');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to renew');
    } finally { setProcessing(null); }
  };

  const handleTerminate = async () => {
    if (!termModal) return;
    setProcessing(termModal.id);
    try {
      await terminateContract(termModal.id, { remarks });
      toast.success('Contract terminated.');
      setTermModal(null); setRemarks('');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to terminate');
    } finally { setProcessing(null); }
  };

  const allUrgent = [...renewalDue, ...expiring].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  const criticalCount = allUrgent.filter(c => c.daysUntilExpiry <= 7).length;
  const urgentCount = allUrgent.filter(c => c.daysUntilExpiry > 7 && c.daysUntilExpiry <= 15).length;
  const attentionCount = allUrgent.filter(c => c.daysUntilExpiry > 15).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
      <p className="text-sm text-slate-500">Loading Renewal Queue…</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Renewal Queue</h1>
          </div>
          <p className="text-sm text-slate-400 ml-[52px]">
            Prioritized decision center for renewals, renegotiations, and terminations.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-amber-300 font-bold text-sm">{allUrgent.length} Active Targets</span>
        </div>
      </div>

      {/* ─── KPI Strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Critical', sub: '≤7 Days', value: criticalCount, color: 'rose', ping: true },
          { label: 'Urgent', sub: '8–15 Days', value: urgentCount, color: 'amber', ping: false },
          { label: 'Attention', sub: '16–30 Days', value: attentionCount, color: 'blue', ping: false },
        ].map(k => (
          <div key={k.label} className={`relative overflow-hidden rounded-2xl bg-[#0c101b] border p-6 ${
            k.color === 'rose' ? 'border-rose-500/20' :
            k.color === 'amber' ? 'border-amber-500/20' : 'border-blue-500/20'
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-px ${
              k.color === 'rose' ? 'bg-gradient-to-r from-rose-500 to-transparent' :
              k.color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-transparent' :
              'bg-gradient-to-r from-blue-500 to-transparent'
            }`} />
            <div className="flex items-center gap-2 mb-3">
              {k.ping && <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>}
              <span className={`text-xs font-bold uppercase tracking-widest ${
                k.color === 'rose' ? 'text-rose-400' :
                k.color === 'amber' ? 'text-amber-400' : 'text-blue-400'
              }`}>{k.label}</span>
              <span className="text-xs text-slate-600">{k.sub}</span>
            </div>
            <div className={`text-5xl font-bold tracking-tight mb-1 ${
              k.color === 'rose' ? 'text-rose-300' :
              k.color === 'amber' ? 'text-amber-300' : 'text-blue-300'
            }`}>{k.value}</div>
            <div className="text-xs text-slate-600">contracts</div>
          </div>
        ))}
      </div>

      {/* ─── Queue ───────────────────────────────────────────────────── */}
      {allUrgent.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 rounded-2xl bg-[#0c101b] border border-white/5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 size={30} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">All Clear!</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">No pending renewals. All contracts are on healthy runways.</p>
          </div>
          <button className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all" onClick={() => navigate('/contracts')}>
            View All Contracts
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {allUrgent.map(c => {
            const urgency = getUrgencyColor(c.daysUntilExpiry);
            const isProcessing = processing === c.id;
            const isCritical = c.daysUntilExpiry <= 7;

            return (
              <div
                key={c.id}
                className={`group rounded-2xl bg-[#0c101b] border transition-all p-5 sm:p-6 ${
                  isCritical ? 'border-rose-500/20 hover:border-rose-500/40' : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  {/* Left: Info */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors hover:underline truncate"
                        onClick={() => navigate(`/contracts/${c.id}`)}
                      >
                        {c.title}
                      </button>
                      <span className="text-[11px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 shrink-0">
                        {c.contractNumber}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Building2 size={13} className="text-slate-600 shrink-0" />
                        <span className="font-medium text-slate-300">{c.vendorName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={13} className="text-slate-600 shrink-0" />
                        <span>Expires <strong className="text-white font-mono">{formatDate(c.endDate)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={13} className="text-slate-600 shrink-0" />
                        <span>Notice: <strong className="text-white">{c.renewalNoticeDays}d</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <DollarSign size={13} className="text-slate-600 shrink-0" />
                        <span className="font-bold text-white font-mono">{formatCurrency(c.contractValue, c.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Countdown */}
                  <div className={`shrink-0 px-5 py-3 rounded-2xl border text-center min-w-[130px] ${
                    isCritical ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Runway</div>
                    <div className="text-xl font-bold font-mono" style={{ color: urgency }}>
                      {getDaysLabel(c.daysUntilExpiry)}
                    </div>
                    {isCritical && <div className="text-[10px] text-rose-400 font-bold mt-1 uppercase">Critical</div>}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                      onClick={() => navigate(`/contracts/${c.id}`)}
                      title="Inspect"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-sm font-semibold transition-all disabled:opacity-40"
                      onClick={() => { setRenewModal(c); setRenewDate(''); setRemarks(''); }}
                      disabled={isProcessing}
                    >
                      <RefreshCw size={14} /> Renew
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-sm font-semibold transition-all disabled:opacity-40"
                      onClick={() => { setTermModal(c); setRemarks(''); }}
                      disabled={isProcessing}
                    >
                      <XCircle size={14} /> Terminate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Renew Modal ─────────────────────────────────────────────── */}
      {renewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl" onClick={() => setRenewModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-[#0c101b] border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <RefreshCw size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Execute Contract Renewal</h3>
                  <p className="text-xs text-slate-500">{renewModal.title}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-400">
                Current expiry: <span className="font-mono font-bold text-white">{formatDate(renewModal.endDate)}</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New End Date <span className="text-rose-400">*</span></label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  min={renewModal.endDate}
                  value={renewDate}
                  onChange={e => setRenewDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Renewal Remarks</label>
                <textarea
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                  rows={3}
                  placeholder="e.g. Extended 12 months with locked pricing…"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-black/20">
              <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all" onClick={() => setRenewModal(null)}>Cancel</button>
              <button
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-40"
                onClick={handleRenew}
                disabled={processing !== null}
              >
                {processing ? 'Processing…' : 'Confirm Renewal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Terminate Modal ──────────────────────────────────────────── */}
      {termModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl" onClick={() => setTermModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-[#0c101b] border border-rose-500/20 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Terminate Contract</h3>
                  <p className="text-xs text-slate-500">{termModal.title}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 text-sm text-slate-300">
                This contract will be marked <strong className="text-rose-400">TERMINATED</strong> and removed from all renewal queues permanently.
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Termination Reason</label>
                <textarea
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-rose-500/50 transition-all resize-none"
                  rows={3}
                  placeholder="e.g. Replaced by alternate vendor…"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-black/20">
              <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all" onClick={() => setTermModal(null)}>Cancel</button>
              <button
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:opacity-40"
                onClick={handleTerminate}
                disabled={processing !== null}
              >
                {processing ? 'Terminating…' : 'Confirm Termination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
