import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, XCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { getRenewalDueContracts, getExpiringContracts, renewContract, terminateContract } from '../services/contractService';
import type { Contract } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate, getDaysLabel, getUrgencyColor, getUrgencyLabel } from '../utils/formatters';
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
    if (!renewModal || !renewDate) { toast.error('Please select a new end date.'); return; }
    setProcessing(renewModal.id);
    try {
      await renewContract(renewModal.id, { newEndDate: renewDate, remarks });
      toast.success('Contract renewed successfully.');
      setRenewModal(null);
      fetchData();
    } finally { setProcessing(null); }
  };

  const handleTerminate = async () => {
    if (!termModal) return;
    setProcessing(termModal.id);
    try {
      await terminateContract(termModal.id, { remarks });
      toast.success('Contract terminated. It will no longer appear in renewal reminders.');
      setTermModal(null);
      fetchData();
    } finally { setProcessing(null); }
  };

  if (loading) return (
    <div style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Loading renewals…</div>
  );

  const allUrgent = [...renewalDue, ...expiring].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚡ Renewal Command Center</h1>
          <p className="page-subtitle">
            {renewalDue.length} contracts require immediate renewal decision
          </p>
        </div>
      </div>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card card-sm" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-danger)', marginBottom: '0.3rem' }}>In Renewal Window</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-danger)' }}>{renewalDue.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Require decision now</div>
        </div>
        <div className="card card-sm" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-warning)', marginBottom: '0.3rem' }}>Expiring Soon</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-warning)' }}>{expiring.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Within 30 days</div>
        </div>
        <div className="card card-sm" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-success)', marginBottom: '0.3rem' }}>Total Urgent</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)' }}>{allUrgent.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contracts needing attention</div>
        </div>
      </div>

      {allUrgent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }}>
            <RefreshCw size={32} />
          </div>
          <h3>All Clear!</h3>
          <p>No contracts require renewal attention right now. Check back daily for updates.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/contracts')}>
            View All Contracts
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {allUrgent.map(contract => {
            const urgencyColor = getUrgencyColor(contract.daysUntilExpiry);
            const urgencyLabel = getUrgencyLabel(contract.daysUntilExpiry);
            const isRenewalDue = contract.status === 'RENEWAL_DUE';

            return (
              <div
                key={contract.id}
                className="card"
                style={{ borderColor: urgencyColor + '44', borderLeftWidth: 3, borderLeftColor: urgencyColor }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center' }}>
                  <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                      <AlertTriangle size={16} color={urgencyColor} />
                      <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{contract.title}</h3>
                      <StatusBadge status={contract.status} />
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 9999,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        background: urgencyColor + '22',
                        color: urgencyColor,
                        textTransform: 'uppercase'
                      }}>
                        {urgencyLabel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Vendor</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{contract.vendorName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Expires</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{formatDate(contract.endDate)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Review Date</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{formatDate(contract.renewalReviewDate)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Notice Period</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{contract.renewalNoticeDays} days</div>
                      </div>
                    </div>

                    {/* Countdown */}
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} color={urgencyColor} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: urgencyColor }}>
                        {getDaysLabel(contract.daysUntilExpiry)} remaining
                      </span>
                      {isRenewalDue && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', fontStyle: 'italic' }}>
                          · Renewal deadline approaching
                        </span>
                      )}
                    </div>

                    <div className="progress-bar" style={{ marginTop: '0.5rem', maxWidth: 300 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.max(2, Math.min(100, ((30 - Math.max(0, contract.daysUntilExpiry)) / 30) * 100))}%`,
                          background: urgencyColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 120 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                    >
                      <ArrowRight size={14} /> Review
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => { setRenewModal(contract); setRenewDate(''); setRemarks(''); }}
                      disabled={contract.status === 'TERMINATED'}
                    >
                      <RefreshCw size={14} /> Renew
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => { setTermModal(contract); setRemarks(''); }}
                      disabled={contract.status === 'TERMINATED'}
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

      {/* Renew Modal */}
      {renewModal && (
        <div className="modal-overlay" onClick={() => setRenewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔄 Renew Contract</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Renewing <strong>{renewModal.title}</strong>. Current end date: <strong>{formatDate(renewModal.endDate)}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">New End Date <span className="required">*</span></label>
                <input type="date" className="form-input" value={renewDate} onChange={e => setRenewDate(e.target.value)} min={renewModal.endDate} />
                <p className="form-hint">Must be after {formatDate(renewModal.endDate)}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea className="form-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Notes about this renewal…" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRenewModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={handleRenew} disabled={!renewDate || !!processing}>
                {processing ? 'Renewing…' : 'Confirm Renewal'}
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
              <h3 className="modal-title">❌ Terminate Contract</h3>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                ⚠️ Terminated contracts will NOT appear in active renewal reminders.
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Reason for termination…" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setTermModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleTerminate} disabled={!!processing}>
                {processing ? 'Terminating…' : 'Confirm Termination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
