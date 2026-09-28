import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, XCircle, Edit, Trash2,
  FileText, Building2, Clock, ExternalLink,
  CheckCircle2
} from 'lucide-react';
import {
  getContract, getContractDecisions, renewContract,
  terminateContract, deleteContract, addDocumentReference
} from '../services/contractService';
import type { Contract, RenewalDecision } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import ContractFormModal from '../components/ContractFormModal';
import { formatDate, formatDateTime, getDaysLabel, getUrgencyColor } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [decisions, setDecisions] = useState<RenewalDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [renewDate, setRenewDate] = useState('');
  const [renewRemarks, setRenewRemarks] = useState('');
  const [termRemarks, setTermRemarks] = useState('');
  const [docName, setDocName] = useState('');
  const [docRef, setDocRef] = useState('');
  const [processing, setProcessing] = useState(false);

  const contractId = parseInt(id!);

  const fetchData = () => {
    if (!contractId) return;
    setLoading(true);
    Promise.all([
      getContract(contractId),
      getContractDecisions(contractId),
    ]).then(([c, d]) => {
      setContract(c);
      setDecisions(d);
    }).catch(() => {
      toast.error('Contract not found.');
      navigate('/contracts');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [contractId]);

  const handleRenew = async () => {
    if (!renewDate) { toast.error('Please select a new end date.'); return; }
    setProcessing(true);
    try {
      await renewContract(contractId, { newEndDate: renewDate, remarks: renewRemarks });
      toast.success('Contract renewed successfully.');
      setShowRenewModal(false);
      fetchData();
    } finally { setProcessing(false); }
  };

  const handleTerminate = async () => {
    setProcessing(true);
    try {
      await terminateContract(contractId, { remarks: termRemarks });
      toast.success('Contract terminated successfully.');
      setShowTermModal(false);
      fetchData();
    } finally { setProcessing(false); }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      await deleteContract(contractId);
      toast.success('Contract deleted.');
      navigate('/contracts');
    } finally { setProcessing(false); }
  };

  const handleAddDoc = async () => {
    setProcessing(true);
    try {
      await addDocumentReference(contractId, { documentName: docName, documentReference: docRef });
      toast.success('Document reference added.');
      setShowDocModal(false);
      fetchData();
    } finally { setProcessing(false); }
  };

  if (loading) return (
    <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading contract details…</div>
  );
  if (!contract) return null;

  const urgencyColor = getUrgencyColor(contract.daysUntilExpiry);
  const canRenew = contract.status !== 'TERMINATED' && contract.status !== 'EXPIRED';
  const canTerminate = contract.status !== 'TERMINATED';

  return (
    <div>
      {/* Back + Header */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/contracts')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to Contracts
      </button>

      <div className="page-header">
        <div>
          <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{contract.title}</h1>
            <StatusBadge status={contract.status} />
          </div>
          <p className="page-subtitle">
            Contract #{contract.contractNumber} · {contract.vendorName}
          </p>
        </div>
        <div className="flex gap-2">
          {canRenew && (
            <button className="btn btn-success btn-sm" onClick={() => setShowRenewModal(true)}>
              <RefreshCw size={14} /> Renew
            </button>
          )}
          {canTerminate && (
            <button className="btn btn-danger btn-sm" onClick={() => setShowTermModal(true)}>
              <XCircle size={14} /> Terminate
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>
            <Edit size={14} /> Edit
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(true)} style={{ color: 'var(--color-danger)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Vendor Card */}
          <div className="card">
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Building2 size={14} /> Vendor Information
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{contract.vendorName}</div>
            {contract.vendorEmail && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {contract.vendorEmail}
              </div>
            )}
          </div>

          {/* Date Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="card card-sm" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-success)', marginBottom: '0.3rem' }}>Start Date</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatDate(contract.startDate)}</div>
            </div>
            <div className="card card-sm" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-warning)', marginBottom: '0.3rem' }}>Review Date</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatDate(contract.renewalReviewDate)}</div>
            </div>
            <div className="card card-sm" style={{ borderColor: urgencyColor + '55' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: urgencyColor, marginBottom: '0.3rem' }}>End Date</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatDate(contract.endDate)}</div>
            </div>
          </div>

          {/* Days Remaining */}
          <div className="card" style={{ borderColor: urgencyColor + '44' }}>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Time Remaining</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: urgencyColor, marginTop: '0.25rem' }}>
                  {getDaysLabel(contract.daysUntilExpiry)}
                </div>
              </div>
              <Clock size={40} color={urgencyColor} style={{ opacity: 0.3 }} />
            </div>
            <div className="progress-bar" style={{ marginTop: '1rem' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.max(2, Math.min(100, (contract.daysUntilExpiry / 365) * 100))}%`,
                  background: urgencyColor,
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Notice period: {contract.renewalNoticeDays} days
            </div>
          </div>

          {/* Description */}
          {contract.description && (
            <div className="card">
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Description</div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{contract.description}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Document Reference */}
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <FileText size={14} /> Documents
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDocModal(true)}>
                + Add Reference
              </button>
            </div>
            {contract.documentReference ? (
              <div className="card card-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    📄 {contract.documentName || 'Contract Document'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {contract.documentReference}
                  </div>
                </div>
                <a
                  href={contract.documentReference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  <ExternalLink size={14} /> Open
                </a>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <p>No document reference attached.</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowDocModal(true)}>
                  Add Reference
                </button>
              </div>
            )}
          </div>

          {/* Renewal History */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              📋 Renewal History
            </div>
            {decisions.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <p>No renewal decisions recorded yet.</p>
              </div>
            ) : (
              <div className="timeline">
                {decisions.map(d => (
                  <div key={d.id} className="timeline-item">
                    <div
                      className="timeline-dot"
                      style={{
                        background: d.decision === 'RENEWED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: d.decision === 'RENEWED' ? 'var(--color-success)' : 'var(--color-danger)',
                      }}
                    >
                      {d.decision === 'RENEWED' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-label">
                        {d.decision === 'RENEWED' ? '✅ Renewed' : '❌ Terminated'}
                        {d.newEndDate && <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> → {formatDate(d.newEndDate)}</span>}
                      </div>
                      {d.remarks && <div className="timeline-time">{d.remarks}</div>}
                      <div className="timeline-time">{formatDateTime(d.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Created</span>
                <span>{formatDateTime(contract.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Last Updated</span>
                <span>{formatDateTime(contract.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Contract ID</span>
                <span>#{contract.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="modal-overlay" onClick={() => setShowRenewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔄 Renew Contract</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Renewing <strong>{contract.title}</strong>. Current end date: <strong>{formatDate(contract.endDate)}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">New End Date <span className="required">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={renewDate}
                  onChange={e => setRenewDate(e.target.value)}
                  min={contract.endDate}
                />
                <p className="form-hint">Must be after current end date ({formatDate(contract.endDate)})</p>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea
                  className="form-textarea"
                  value={renewRemarks}
                  onChange={e => setRenewRemarks(e.target.value)}
                  placeholder="Optional notes about this renewal…"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRenewModal(false)} disabled={processing}>Cancel</button>
              <button className="btn btn-success" onClick={handleRenew} disabled={processing || !renewDate}>
                {processing ? 'Renewing…' : '✅ Confirm Renewal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTermModal && (
        <div className="modal-overlay" onClick={() => setShowTermModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">❌ Terminate Contract</h3>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', fontSize: '0.875rem' }}>
                ⚠️ Terminated contracts will NOT appear in renewal reminders or active alerts.
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Termination</label>
                <textarea
                  className="form-textarea"
                  value={termRemarks}
                  onChange={e => setTermRemarks(e.target.value)}
                  placeholder="e.g., Switching to a different vendor, project completed…"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowTermModal(false)} disabled={processing}>Cancel</button>
              <button className="btn btn-danger" onClick={handleTerminate} disabled={processing}>
                {processing ? 'Terminating…' : '❌ Confirm Termination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete Contract"
          message={`Are you sure you want to permanently delete "${contract.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={processing}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <ContractFormModal
          contract={contract}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { setShowEditModal(false); fetchData(); }}
        />
      )}

      {/* Document Reference Modal */}
      {showDocModal && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📄 Add Document Reference</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input className="form-input" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g., Contract Agreement.pdf" />
              </div>
              <div className="form-group">
                <label className="form-label">Reference URL / Path</label>
                <input className="form-input" value={docRef} onChange={e => setDocRef(e.target.value)} placeholder="https://… or /path/to/file" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDocModal(false)} disabled={processing}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddDoc} disabled={processing || !docRef}>
                {processing ? 'Saving…' : 'Save Reference'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
