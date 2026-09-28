import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, XCircle, Edit, Trash2,
  FileText, Building2, ExternalLink,
  CheckCircle2, ShieldAlert, DollarSign,
  Plus, History, ChevronRight
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
import { formatDate, formatDateTime, getDaysLabel, getUrgencyColor } from '../utils/formatters';
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
    uploadedBy: 'Alex Mercer (Admin)',
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
      toast.success('Contract terminated.');
      setShowTermModal(false);
      setTermRemarks('');
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
      toast.success('Contract deleted.');
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
      toast.error('Please provide a document name and URL/path reference.');
      return;
    }
    setProcessing(true);
    try {
      await addContractDocument(contractId, docForm);
      toast.success('Document uploaded / referenced successfully.');
      setShowAddDocModal(false);
      setDocForm({
        name: '',
        type: 'CONTRACT',
        version: '1.0',
        reference: '',
        uploadedBy: 'Alex Mercer (Admin)',
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
      toast.success('Document removed.');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to remove document.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mr-3" />
        <span>Loading enterprise contract details...</span>
      </div>
    );
  }

  if (!contract) return null;

  const urgencyColor = getUrgencyColor(contract.daysUntilExpiry);
  const canRenew = contract.status !== 'TERMINATED' && contract.status !== 'EXPIRED';
  const canTerminate = contract.status !== 'TERMINATED';

  // Dynamic Risk Level Colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', bar: '#f43f5e' };
      case 'HIGH': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', bar: '#f59e0b' };
      case 'MEDIUM': return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', bar: '#3b82f6' };
      case 'LOW':
      default: return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', bar: '#10b981' };
    }
  };

  const riskTheme = getRiskColor(contract.riskLevel);

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <button 
        className="btn btn-ghost btn-sm flex items-center gap-1.5 text-slate-400 hover:text-slate-100"
        onClick={() => navigate('/contracts')}
      >
        <ArrowLeft size={16} /> Back to Contracts
      </button>

      {/* Hero Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-100">{contract.title}</h1>
            <StatusBadge status={contract.status} />
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${riskTheme.bg} ${riskTheme.text} border ${riskTheme.border}`}>
              Risk: {contract.riskLevel} ({contract.riskScore}/100)
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Contract Number: <span className="font-mono text-slate-200">{contract.contractNumber}</span> • Vendor: <span className="text-indigo-400 font-medium">{contract.vendorName}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canRenew && (
            <button className="btn btn-success btn-sm flex items-center gap-1.5" onClick={() => setShowRenewModal(true)}>
              <RefreshCw size={14} /> Renew Contract
            </button>
          )}
          {canTerminate && (
            <button className="btn btn-danger btn-sm flex items-center gap-1.5" onClick={() => setShowTermModal(true)}>
              <XCircle size={14} /> Terminate
            </button>
          )}
          <button className="btn btn-secondary btn-sm flex items-center gap-1.5" onClick={() => setShowEditModal(true)}>
            <Edit size={14} /> Edit
          </button>
          <button className="btn btn-ghost btn-sm text-rose-400 hover:bg-rose-500/10 p-2" onClick={() => setShowDeleteModal(true)} title="Delete Contract">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Overview, Dates, Financials, Risk Meter */}
        <div className="lg:col-span-7 space-y-6">

          {/* Dynamic Risk Score Analysis Card */}
          <div className={`rounded-2xl p-5 border ${riskTheme.border} ${riskTheme.bg} shadow-lg backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-5 h-5 ${riskTheme.text}`} />
                <h3 className="font-semibold text-slate-200">Contract Risk Engine Analysis</h3>
              </div>
              <span className={`text-lg font-black font-mono ${riskTheme.text}`}>
                {contract.riskScore} <span className="text-xs font-normal opacity-70">/ 100</span>
              </span>
            </div>

            {/* Meter Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-4">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(5, Math.min(100, contract.riskScore))}%`, backgroundColor: riskTheme.bar }}
              />
            </div>

            {/* Risk Reasons */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Risk Factors Identified:</span>
              {contract.riskReasons && contract.riskReasons.length > 0 ? (
                <ul className="space-y-1">
                  {contract.riskReasons.map((reason, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">All risk metrics are nominal. Good renewal runway and documentation present.</p>
              )}
            </div>
          </div>

          {/* Dates & Countdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Start Date</div>
              <div className="text-base font-bold text-slate-200">{formatDate(contract.startDate)}</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Renewal Review</div>
              <div className="text-base font-bold text-slate-200">{formatDate(contract.renewalReviewDate)}</div>
              <div className="text-xs text-slate-400 mt-1">Notice: {contract.renewalNoticeDays} days</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4" style={{ borderColor: urgencyColor + '55' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: urgencyColor }}>End / Expiry</div>
              <div className="text-base font-bold text-slate-200">{formatDate(contract.endDate)}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: urgencyColor }}>
                {getDaysLabel(contract.daysUntilExpiry)}
              </div>
            </div>
          </div>

          {/* Financial & Commercial Terms */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Commercial Terms & Value
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-slate-500">Contract Value</span>
                <div className="text-xl font-bold text-slate-100 mt-0.5">
                  {contract.currency === 'INR' ? '₹' : '$'}{contract.contractValue ? Number(contract.contractValue).toLocaleString() : '0'}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Currency</span>
                <div className="text-sm font-semibold text-slate-300 mt-1">
                  {contract.currency || 'USD'}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Billing Cadence</span>
                <div className="text-sm font-semibold text-slate-300 mt-1">
                  {contract.paymentFrequency || 'ANNUAL'}
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Information & Description */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-indigo-400" /> Vendor Information
              </div>
              <button 
                onClick={() => navigate(`/vendors?id=${contract.vendorId}`)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                View Vendor Profile <ChevronRight size={14} />
              </button>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">{contract.vendorName}</div>
              {contract.vendorEmail && (
                <div className="text-sm text-slate-400 mt-0.5">{contract.vendorEmail}</div>
              )}
            </div>
            {contract.description && (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Description & Scope</span>
                <p className="text-sm text-slate-300 leading-relaxed">{contract.description}</p>
              </div>
            )}
          </div>

          {/* Documents Section (Multi-document support) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <FileText className="w-4 h-4 text-blue-400" /> Contract Documents ({documents.length})
              </div>
              <button 
                className="btn btn-secondary btn-sm flex items-center gap-1 text-xs"
                onClick={() => setShowAddDocModal(true)}
              >
                <Plus size={14} /> Add Document
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-400 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No document references attached to this contract.</p>
                <button 
                  className="btn btn-ghost btn-sm text-indigo-400 mt-2"
                  onClick={() => setShowAddDocModal(true)}
                >
                  Upload or Link Document Reference
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Ver</th>
                      <th className="pb-2">Reference</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 font-medium text-slate-200">
                          {doc.name}
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-300 font-mono">
                            {doc.type}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400 text-xs font-mono">
                          v{doc.version || '1.0'}
                        </td>
                        <td className="py-2.5">
                          <a 
                            href={doc.reference} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            Open Link <ExternalLink size={12} />
                          </a>
                        </td>
                        <td className="py-2.5 text-right">
                          <button 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Remove Document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Audit Timeline & Renewal History */}
        <div className="lg:col-span-5 space-y-6">

          {/* Audit Event Timeline */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Contract Audit Trail</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {auditEvents.length} events logged
              </span>
            </div>

            <AuditTimeline events={auditEvents} loading={loading} />
          </div>

          {/* Renewal Decision History */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="font-semibold text-slate-300 text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Formal Renewal Decisions</span>
            </div>

            {decisions.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No formal renewal decisions recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {decisions.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${d.decision === 'RENEWED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {d.decision === 'RENEWED' ? '✅ RENEWED' : '❌ TERMINATED'}
                      </span>
                      <span className="text-slate-500 font-mono">{formatDateTime(d.createdAt)}</span>
                    </div>
                    {d.newEndDate && (
                      <div className="text-slate-300">
                        New End Date: <span className="font-bold text-slate-200">{formatDate(d.newEndDate)}</span>
                      </div>
                    )}
                    {d.remarks && (
                      <div className="text-slate-400 italic mt-1">"{d.remarks}"</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODALS ─── */}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="modal-overlay" onClick={() => setShowRenewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔄 Renew Contract</h3>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-xs text-slate-400">
                Renewing <strong>{contract.title}</strong>. Current end date is <strong>{formatDate(contract.endDate)}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">New End Date <span className="required">*</span></label>
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
                <label className="form-label">Remarks / Terms Updated</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Renewed for an additional 12-month term with 5% discount."
                  value={renewRemarks}
                  onChange={e => setRenewRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRenewModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleRenew} disabled={processing}>
                {processing ? 'Renewing...' : 'Confirm Renewal'}
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
              <h3 className="modal-title text-rose-400">❌ Terminate Contract</h3>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-xs text-slate-400">
                Terminating <strong>{contract.title}</strong>. This contract will be removed from all active renewal alerts.
              </p>
              <div className="form-group">
                <label className="form-label">Reason for Termination</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Replaced by alternate provider; vendor service discontinued."
                  value={termRemarks}
                  onChange={e => setTermRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTermModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleTerminate} disabled={processing}>
                {processing ? 'Terminating...' : 'Confirm Termination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDocModal && (
        <div className="modal-overlay" onClick={() => setShowAddDocModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleAddDocument}>
              <div className="modal-header">
                <h3 className="modal-title">📄 Add Document Reference</h3>
              </div>
              <div className="modal-body space-y-4">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Type</label>
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
                  <label className="form-label">Reference / URL <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://drive.google.com/... or /docs/msa_2026.pdf"
                    value={docForm.reference}
                    onChange={e => setDocForm({ ...docForm, reference: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Signed counterparty execution copy"
                    value={docForm.description}
                    onChange={e => setDocForm({ ...docForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDocModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={processing}>
                  {processing ? 'Saving...' : 'Add Document'}
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
          title="Delete Contract"
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
