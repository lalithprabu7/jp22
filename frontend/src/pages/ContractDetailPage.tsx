import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, XCircle, Edit, Trash2,
  FileText, ExternalLink,
  CheckCircle2, ShieldAlert, DollarSign,
  Plus, History
} from 'lucide-react';
import {
  getContract, getContractDecisions, renewContract,
  terminateContract, deleteContract, getContractDocuments,
  addContractDocument, deleteDocument, getContractAuditTimeline
} from '../services/contractService';
import type { 
  Contract, RenewalDecision, DocumentDto, AuditEventDto, CreateDocumentRequest 
} from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import ContractFormModal from '../components/ContractFormModal';
import AuditTimeline from '../components/AuditTimeline';
import { formatDate, formatDateTime, getDaysLabel, getUrgencyColor, formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contractId = parseInt(id || '0');

  const [contract, setContract] = useState<Contract | null>(null);
  const [decisions, setDecisions] = useState<RenewalDecision[]>([]);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventDto[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modals state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);

  // Form states
  const [renewDate, setRenewDate] = useState('');
  const [renewRemarks, setRenewRemarks] = useState('');
  const [termRemarks, setTermRemarks] = useState('');

  // Add Document form
  const [docForm, setDocForm] = useState<CreateDocumentRequest>({
    name: '',
    type: 'CONTRACT',
    version: '1.0',
    reference: '',
    uploadedBy: 'Lalith (Admin)',
    description: '',
  });

  const fetchData = async () => {
    if (!contractId) return;
    setLoading(true);
    try {
      const [c, d, docs, audits] = await Promise.all([
        getContract(contractId),
        getContractDecisions(contractId).catch(() => []),
        getContractDocuments(contractId).catch(() => []),
        getContractAuditTimeline(contractId).catch(() => []),
      ]);
      setContract(c);
      setDecisions(d);
      setDocuments(docs);
      setAuditEvents(audits);
    } catch {
      toast.error('Contract not found or failed to load.');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contractId]);

  const handleRenew = async () => {
    if (!renewDate) {
      toast.error('Please select a new end date.');
      return;
    }
    setProcessing(true);
    try {
      await renewContract(contractId, { newEndDate: renewDate, remarks: renewRemarks });
      toast.success('Contract renewed successfully.');
      setShowRenewModal(false);
      setRenewDate('');
      setRenewRemarks('');
      document.dispatchEvent(new CustomEvent('notifications-updated'));
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to renew contract');
    } finally {
      setProcessing(false);
    }
  };

  const handleTerminate = async () => {
    setProcessing(true);
    try {
      await terminateContract(contractId, { remarks: termRemarks });
      toast.success('Contract marked as terminated.');
      setShowTermModal(false);
      setTermRemarks('');
      document.dispatchEvent(new CustomEvent('notifications-updated'));
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to terminate contract');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      await deleteContract(contractId);
      toast.success('Contract record deleted.');
      document.dispatchEvent(new CustomEvent('notifications-updated'));
      navigate('/contracts');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete contract');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name.trim() || !docForm.reference.trim()) {
      toast.error('Please provide a document title and URL/reference.');
      return;
    }
    setProcessing(true);
    try {
      await addContractDocument(contractId, docForm);
      toast.success('Document reference attached.');
      setShowAddDocModal(false);
      setDocForm({
        name: '',
        type: 'CONTRACT',
        version: '1.0',
        reference: '',
        uploadedBy: 'Lalith (Admin)',
        description: '',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add document.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm('Delete this document reference?')) return;
    try {
      await deleteDocument(docId);
      toast.success('Document reference removed.');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to remove document.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Loading enterprise contract details...</p>
      </div>
    );
  }

  if (!contract) return null;

  const urgencyColor = getUrgencyColor(contract.daysUntilExpiry);
  const canRenew = contract.status !== 'TERMINATED' && contract.status !== 'EXPIRED';
  const canTerminate = contract.status !== 'TERMINATED';

  const getRiskTheme = (level: string) => {
    switch (level) {
      case 'CRITICAL': 
        return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171', bar: '#ef4444' };
      case 'HIGH': 
        return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24', bar: '#f59e0b' };
      case 'MEDIUM': 
        return { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)', text: '#38bdf8', bar: '#0284c7' };
      case 'LOW':
      default: 
        return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399', bar: '#10b981' };
    }
  };

  const riskTheme = getRiskTheme(contract.riskLevel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Top back navigation */}
      <div>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => navigate('/contracts')}
          style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} /> Back to Contracts Directory
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {contract.title}
              </h1>
              <StatusBadge status={contract.status} />
              <span style={{ 
                fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '20px',
                background: riskTheme.bg, color: riskTheme.text, border: `1px solid ${riskTheme.border}`,
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                Risk: {contract.riskLevel} ({contract.riskScore}/100)
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Reference ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{contract.contractNumber}</span>
              &nbsp;&bull;&nbsp;
              Vendor Partner: <span style={{ color: '#818cf8', fontWeight: 700 }}>{contract.vendorName}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            {canRenew && (
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => setShowRenewModal(true)}
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                <RefreshCw size={14} /> Renew Contract
              </button>
            )}
            {canTerminate && (
              <button 
                className="btn btn-sm" 
                onClick={() => setShowTermModal(true)}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px' 
                }}
              >
                <XCircle size={14} /> Terminate
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>
              <Edit size={14} /> Edit
            </button>
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              onClick={() => setShowDeleteModal(true)} 
              title="Delete Contract"
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Risk, Dates, Commercials, Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Risk Engine Analysis Card */}
          <div className="card" style={{ 
            padding: '1.5rem', 
            background: `linear-gradient(135deg, ${riskTheme.bg}, rgba(15, 23, 42, 0.8))`,
            border: `1px solid ${riskTheme.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldAlert size={20} style={{ color: riskTheme.text }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Automated Risk Engine Assessment
                </h3>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'monospace', color: riskTheme.text }}>
                {contract.riskScore} <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>/ 100</span>
              </span>
            </div>

            {/* Risk Meter Bar */}
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(0, 0, 0, 0.35)', overflow: 'hidden', marginBottom: '1rem' }}>
              <div 
                style={{ 
                  height: '100%', borderRadius: '4px', 
                  width: `${Math.max(5, Math.min(100, contract.riskScore))}%`, 
                  background: riskTheme.bar,
                  transition: 'width 0.6s ease' 
                }} 
              />
            </div>

            {/* Risk Factor Explanations */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.4rem' }}>
                Risk Drivers Identified:
              </span>
              {contract.riskReasons && contract.riskReasons.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {contract.riskReasons.map((reason, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                  All risk metrics are nominal. Safe renewal runway and documentation present.
                </p>
              )}
            </div>
          </div>

          {/* Dates & Urgency Countdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981', marginBottom: '0.25rem' }}>
                Start Date
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatDate(contract.startDate)}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fbbf24', marginBottom: '0.25rem' }}>
                Renewal Review
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatDate(contract.renewalReviewDate)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                Notice: {contract.renewalNoticeDays}d
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', borderColor: urgencyColor + '55' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: urgencyColor, marginBottom: '0.25rem' }}>
                End / Expiry
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatDate(contract.endDate)}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: urgencyColor, marginTop: '0.2rem' }}>
                {getDaysLabel(contract.daysUntilExpiry)}
              </div>
            </div>
          </div>

          {/* Commercial Terms & Value */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
              <DollarSign size={16} style={{ color: '#10b981' }} /> Financial & Commercial Terms
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total Contract Value</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {formatCurrency(Number(contract.contractValue || 0))}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Currency</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {contract.currency || 'USD'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Billing Cadence</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {contract.paymentFrequency || 'ANNUAL'}
                </div>
              </div>
            </div>
          </div>

          {/* Scope and Description */}
          {contract.description && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.4rem' }}>
                Scope & Agreement Terms
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {contract.description}
              </p>
            </div>
          )}

          {/* Documents Section */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <FileText size={16} style={{ color: '#818cf8' }} /> Document Vault ({documents.length})
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ fontSize: '0.75rem' }} 
                onClick={() => setShowAddDocModal(true)}
              >
                <Plus size={14} /> Add Document
              </button>
            </div>

            {documents.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.85rem', margin: '0 0 0.5rem' }}>No document references attached to this agreement.</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddDocModal(true)}>
                  Upload Reference
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                      padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <FileText size={16} style={{ color: '#818cf8' }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                          {doc.type} &bull; v{doc.version || '1.0'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <a 
                        href={doc.reference} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Open <ExternalLink size={12} />
                      </a>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Audit Trail & Formal Decisions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Audit Event Timeline */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <History size={18} style={{ color: '#818cf8' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Contract Audit Timeline
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                {auditEvents.length} events logged
              </span>
            </div>

            <AuditTimeline events={auditEvents} loading={loading} />
          </div>

          {/* Formal Decisions Log */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={18} style={{ color: '#10b981' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Formal Renewal Decisions
              </h3>
            </div>

            {decisions.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                No formal renewal decisions recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {decisions.map((d) => {
                  const isRenew = d.decision === 'RENEWED';
                  return (
                    <div 
                      key={d.id} 
                      style={{ 
                        padding: '0.85rem 1rem', borderRadius: '12px', 
                        background: isRenew ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        border: `1px solid ${isRenew ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ 
                          fontSize: '0.75rem', fontWeight: 800, 
                          color: isRenew ? '#10b981' : '#f87171' 
                        }}>
                          {isRenew ? '✅ RENEWAL CONFIRMED' : '❌ TERMINATED'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                          {formatDateTime(d.createdAt)}
                        </span>
                      </div>
                      {d.newEndDate && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          New Maturity Date: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(d.newEndDate)}</strong>
                        </div>
                      )}
                      {d.remarks && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                          "{d.remarks}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODALS ─── */}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="modal-overlay" onClick={() => setShowRenewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🔄 Execute Renewal Decision</h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Renewing <strong>{contract.title}</strong>. Current expiration is <strong>{formatDate(contract.endDate)}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">New Maturity / End Date <span className="required">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  min={contract.endDate}
                  value={renewDate}
                  onChange={e => setRenewDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Decision Notes / Commercial Terms Updated</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Renewed for an additional 12-month period with approved enterprise terms."
                  value={renewRemarks}
                  onChange={e => setRenewRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRenewModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleRenew} 
                disabled={processing}
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
              >
                {processing ? 'Processing...' : 'Confirm Renewal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTermModal && (
        <div className="modal-overlay" onClick={() => setShowTermModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#f87171' }}>❌ Terminate Contract</h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Terminating <strong>{contract.title}</strong>. This contract will transition out of active tracking.
              </p>
              <div className="form-group">
                <label className="form-label">Termination Reason</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Service replaced by internal tooling or renegotiated vendor agreement."
                  value={termRemarks}
                  onChange={e => setTermRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowTermModal(false)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={handleTerminate} 
                disabled={processing}
              >
                {processing ? 'Terminating...' : 'Confirm Termination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDocModal && (
        <div className="modal-overlay" onClick={() => setShowAddDocModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <form onSubmit={handleAddDocument}>
              <div className="modal-header">
                <h3 className="modal-title">📄 Attach Document Reference</h3>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Document Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Master Services Agreement 2026"
                    value={docForm.name}
                    onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Classification</label>
                    <select
                      className="form-input"
                      value={docForm.type}
                      onChange={e => setDocForm({ ...docForm, type: e.target.value })}
                    >
                      <option value="CONTRACT">Contract</option>
                      <option value="INVOICE">Invoice</option>
                      <option value="AGREEMENT">Agreement</option>
                      <option value="AMENDMENT">Amendment</option>
                      <option value="COMPLIANCE">Compliance / SOC2</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Version</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="1.0"
                      value={docForm.version}
                      onChange={e => setDocForm({ ...docForm, version: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reference URL or Cloud Path <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://drive.google.com/... or s3://..."
                    value={docForm.reference}
                    onChange={e => setDocForm({ ...docForm, reference: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Scope Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Fully executed bilateral agreement"
                    value={docForm.description}
                    onChange={e => setDocForm({ ...docForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddDocModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={processing}>
                  {processing ? 'Attaching...' : 'Attach Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contract Modal */}
      {showEditModal && (
        <ContractFormModal
          contract={contract}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete Contract Record"
          message={`Are you sure you want to permanently delete "${contract.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
