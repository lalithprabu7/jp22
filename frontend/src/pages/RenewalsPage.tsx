import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, XCircle, Clock, 
  Building2, CheckCircle2
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

  // Action Modals
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
    if (!renewModal || !renewDate) { 
      toast.error('Please select a new end date.'); 
      return; 
    }
    setProcessing(renewModal.id);
    try {
      await renewContract(renewModal.id, { newEndDate: renewDate, remarks });
      toast.success('Contract successfully renewed!');
      setRenewModal(null);
      setRenewDate('');
      setRemarks('');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to renew contract');
    } finally { 
      setProcessing(null); 
    }
  };

  const handleTerminate = async () => {
    if (!termModal) return;
    setProcessing(termModal.id);
    try {
      await terminateContract(termModal.id, { remarks });
      toast.success('Contract terminated and removed from active alert queues.');
      setTermModal(null);
      setRemarks('');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to terminate contract');
    } finally { 
      setProcessing(null); 
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
        <p>Loading Renewal Command Center...</p>
      </div>
    );
  }

  const allUrgent = [...renewalDue, ...expiring].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  const criticalCount = allUrgent.filter(c => c.daysUntilExpiry <= 7).length;
  const urgentCount = allUrgent.filter(c => c.daysUntilExpiry > 7 && c.daysUntilExpiry <= 15).length;
  const attentionCount = allUrgent.filter(c => c.daysUntilExpiry > 15).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <RefreshCw className="w-7 h-7 text-amber-400 animate-spin-slow" />
            Renewal Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Prioritized decision center to evaluate renegotiations, renewals, and terminations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold font-mono">
            {allUrgent.length} Active Targets
          </span>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-slate-900 to-slate-900">
          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Critical (&le;7 Days)
          </div>
          <div className="text-3xl font-extrabold text-rose-300 font-mono mt-1">{criticalCount}</div>
          <div className="text-xs text-slate-400 mt-1">Imminent deadline expiration</div>
        </div>

        <div className="card p-5 border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Clock size={13} /> Urgent (8–15 Days)
          </div>
          <div className="text-3xl font-extrabold text-amber-300 font-mono mt-1">{urgentCount}</div>
          <div className="text-xs text-slate-400 mt-1">Active review window open</div>
        </div>

        <div className="card p-5 border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Attention (16–30 Days)
          </div>
          <div className="text-3xl font-extrabold text-blue-300 font-mono mt-1">{attentionCount}</div>
          <div className="text-xs text-slate-400 mt-1">Upcoming notice milestones</div>
        </div>
      </div>

      {/* Contract Queue */}
      {allUrgent.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
            <CheckCircle2 size={30} />
          </div>
          <h3 className="text-lg font-bold text-slate-200">Zero Pending Renewals!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All enterprise vendor contracts are on healthy runways with zero renewal actions required today.
          </p>
          <button className="btn btn-secondary btn-sm mt-4" onClick={() => navigate('/contracts')}>
            View All Contracts
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {allUrgent.map(c => {
            const urgency = getUrgencyColor(c.daysUntilExpiry);
            const isProcessing = processing === c.id;

            return (
              <div 
                key={c.id} 
                className="card p-5 border-slate-800 hover:border-slate-700/80 bg-slate-900/70 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
              >
                {/* Left: Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-base text-slate-100 group-hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => navigate(`/contracts/${c.id}`)}>
                      {c.title}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {c.contractNumber}
                    </span>
                    <StatusBadge status={c.status} />
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.riskLevel === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      c.riskLevel === 'HIGH' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      c.riskLevel === 'MEDIUM' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      Risk: {c.riskLevel} ({c.riskScore})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Building2 size={13} className="text-slate-500" />
                      <span>{c.vendorName}</span>
                    </div>
                    <div>
                      <span>Expires: </span>
                      <strong className="text-slate-200 font-mono">{formatDate(c.endDate)}</strong>
                    </div>
                    <div>
                      <span>Notice Required: </span>
                      <strong className="text-slate-200">{c.renewalNoticeDays} days</strong>
                    </div>
                    <div>
                      <span>Review Began: </span>
                      <strong className="text-amber-400 font-mono">{formatDate(c.renewalReviewDate)}</strong>
                    </div>
                    <div>
                      <span>Committed Value: </span>
                      <strong className="text-slate-200 font-mono">{formatCurrency(c.contractValue, c.currency)}</strong>
                    </div>
                  </div>
                </div>

                {/* Center: Countdown indicator */}
                <div className="shrink-0 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[130px]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Runway</div>
                  <div className="text-base font-extrabold font-mono mt-0.5" style={{ color: urgency }}>
                    {getDaysLabel(c.daysUntilExpiry)}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/contracts/${c.id}`)}
                  >
                    Inspect
                  </button>
                  <button
                    className="btn btn-success btn-sm flex items-center gap-1 shadow-sm"
                    onClick={() => {
                      setRenewModal(c);
                      setRenewDate('');
                      setRemarks('');
                    }}
                    disabled={isProcessing}
                  >
                    <RefreshCw size={13} /> Renew
                  </button>
                  <button
                    className="btn btn-danger btn-sm flex items-center gap-1 shadow-sm"
                    onClick={() => {
                      setTermModal(c);
                      setRemarks('');
                    }}
                    disabled={isProcessing}
                  >
                    <XCircle size={13} /> Terminate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Renew Modal */}
      {renewModal && (
        <div className="modal-overlay" onClick={() => setRenewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔄 Execute Contract Renewal</h3>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Renewing <strong>{renewModal.title}</strong> (#{renewModal.contractNumber}). 
                Current expiry: <span className="font-mono text-slate-200">{formatDate(renewModal.endDate)}</span>.
              </p>

              <div className="form-group">
                <label className="form-label">New End Date <span className="required">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  min={renewModal.endDate}
                  value={renewDate}
                  onChange={e => setRenewDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Negotiated Terms / Renewal Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Extended for 12 months with locked tier pricing."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRenewModal(null)}>Cancel</button>
              <button 
                className="btn btn-success" 
                onClick={handleRenew} 
                disabled={processing !== null}
              >
                {processing ? 'Processing...' : 'Confirm Renewal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {termModal && (
        <div className="modal-overlay" onClick={() => setTermModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title text-rose-400">❌ Terminate Vendor Contract</h3>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Terminating <strong>{termModal.title}</strong>. This contract will transition to 
                <span className="font-bold text-rose-400"> TERMINATED</span> and be permanently removed from all renewal notification queues.
              </p>

              <div className="form-group">
                <label className="form-label">Termination Rationale / Exit Note</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Replaced by alternate vendor or requirement decommissioned."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTermModal(null)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={handleTerminate} 
                disabled={processing !== null}
              >
                {processing ? 'Terminating...' : 'Confirm Termination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
