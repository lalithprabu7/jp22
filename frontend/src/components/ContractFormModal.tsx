import { useState, useEffect } from 'react';
import { X, Loader, Calendar } from 'lucide-react';
import { createContract, updateContract, getVendors } from '../services/contractService';
import type { Contract, Vendor } from '../types';
import toast from 'react-hot-toast';

interface ContractFormModalProps {
  contract?: Contract;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContractFormModal({ contract, onClose, onSuccess }: ContractFormModalProps) {
  const isEdit = !!contract;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    contractNumber: contract?.contractNumber ?? '',
    title: contract?.title ?? '',
    description: contract?.description ?? '',
    vendorId: contract?.vendorId?.toString() ?? '',
    startDate: contract?.startDate ?? '',
    endDate: contract?.endDate ?? '',
    renewalNoticeDays: contract?.renewalNoticeDays?.toString() ?? '30',
    documentReference: contract?.documentReference ?? '',
    documentName: contract?.documentName ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getVendors().then(setVendors);
  }, []);

  // Compute preview renewal review date
  const reviewDate = (() => {
    if (!form.endDate || !form.renewalNoticeDays) return null;
    const end = new Date(form.endDate);
    const days = parseInt(form.renewalNoticeDays);
    if (isNaN(days) || days <= 0) return null;
    end.setDate(end.getDate() - days);
    return end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.contractNumber.trim()) errs.contractNumber = 'Contract number is required';
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.vendorId) errs.vendorId = 'Please select a vendor';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      errs.endDate = 'End date must be after start date';
    }
    const days = parseInt(form.renewalNoticeDays);
    if (!days || days <= 0) errs.renewalNoticeDays = 'Notice period must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        contractNumber: form.contractNumber,
        title: form.title,
        description: form.description || undefined,
        vendorId: parseInt(form.vendorId),
        startDate: form.startDate,
        endDate: form.endDate,
        renewalNoticeDays: parseInt(form.renewalNoticeDays),
        documentReference: form.documentReference || undefined,
        documentName: form.documentName || undefined,
      };

      if (isEdit) {
        await updateContract(contract!.id, payload);
        toast.success('Contract updated successfully.');
      } else {
        await createContract(payload);
        toast.success('Contract created successfully.');
      }
      onSuccess();
    } catch {
      // Error toast handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Contract' : 'Add New Contract'}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Contract Info */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Contract Information
            </h4>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Contract Number <span className="required">*</span></label>
                <input className={`form-input ${errors.contractNumber ? 'error' : ''}`} value={form.contractNumber} onChange={set('contractNumber')} placeholder="e.g., CW-2026-001" />
                {errors.contractNumber && <span className="form-error">{errors.contractNumber}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Contract Title <span className="required">*</span></label>
                <input className={`form-input ${errors.title ? 'error' : ''}`} value={form.title} onChange={set('title')} placeholder="e.g., AWS Cloud Infrastructure" />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="Optional contract description…" />
            </div>
          </div>

          <div className="divider" />

          {/* Vendor */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Vendor
            </h4>
            <div className="form-group">
              <label className="form-label">Select Vendor <span className="required">*</span></label>
              <select className={`form-select ${errors.vendorId ? 'error' : ''}`} value={form.vendorId} onChange={set('vendorId')}>
                <option value="">— Choose vendor —</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              {errors.vendorId && <span className="form-error">{errors.vendorId}</span>}
            </div>
          </div>

          <div className="divider" />

          {/* Dates */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Contract Dates
            </h4>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Start Date <span className="required">*</span></label>
                <input type="date" className={`form-input ${errors.startDate ? 'error' : ''}`} value={form.startDate} onChange={set('startDate')} />
                {errors.startDate && <span className="form-error">{errors.startDate}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">End Date <span className="required">*</span></label>
                <input type="date" className={`form-input ${errors.endDate ? 'error' : ''}`} value={form.endDate} onChange={set('endDate')} />
                {errors.endDate && <span className="form-error">{errors.endDate}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Notice Period (days) <span className="required">*</span></label>
                <input type="number" className={`form-input ${errors.renewalNoticeDays ? 'error' : ''}`} value={form.renewalNoticeDays} onChange={set('renewalNoticeDays')} min="1" />
                {errors.renewalNoticeDays && <span className="form-error">{errors.renewalNoticeDays}</span>}
              </div>
            </div>

            {/* Preview */}
            {reviewDate && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Calendar size={14} color="var(--color-primary)" />
                <span style={{ color: 'var(--text-secondary)' }}>Renewal review date:</span>
                <strong style={{ color: 'var(--color-primary)' }}>{reviewDate}</strong>
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Document */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Document Reference (Optional)
            </h4>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input className="form-input" value={form.documentName} onChange={set('documentName')} placeholder="e.g., Agreement.pdf" />
              </div>
              <div className="form-group">
                <label className="form-label">Reference URL / Path</label>
                <input className="form-input" value={form.documentReference} onChange={set('documentReference')} placeholder="https://… or /path/to/file" />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader size={14} className="animate-spin" /> Saving…</> : isEdit ? 'Update Contract' : 'Create Contract'}
          </button>
        </div>
      </div>
    </div>
  );
}
