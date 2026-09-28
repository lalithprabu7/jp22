import React, { useState, useEffect } from 'react';
import { X, Loader, Calendar, Plus, Building2, Check } from 'lucide-react';
import { createContract, updateContract, getVendors, createVendor } from '../services/contractService';
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
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [savingVendor, setSavingVendor] = useState(false);

  // New Vendor Form
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    companyAddress: '',
  });

  const [form, setForm] = useState({
    contractNumber: contract?.contractNumber ?? '',
    title: contract?.title ?? '',
    description: contract?.description ?? '',
    vendorId: contract?.vendorId?.toString() ?? '',
    startDate: contract?.startDate ?? '',
    endDate: contract?.endDate ?? '',
    renewalNoticeDays: contract?.renewalNoticeDays?.toString() ?? '30',
    contractValue: contract?.contractValue?.toString() ?? '100000',
    currency: contract?.currency ?? 'INR',
    paymentFrequency: contract?.paymentFrequency ?? 'ANNUAL',
    documentReference: contract?.documentReference ?? '',
    documentName: contract?.documentName ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getVendors().then(setVendors).catch(() => {});
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

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    setSavingVendor(true);
    try {
      const created = await createVendor(newVendorForm);
      setVendors(prev => [created, ...prev]);
      setForm(prev => ({ ...prev, vendorId: created.id.toString() }));
      toast.success(`Vendor "${created.name}" created and selected!`);
      setShowAddVendor(false);
      setNewVendorForm({ name: '', contactPerson: '', email: '', phone: '', companyAddress: '' });
      if (errors.vendorId) setErrors(prev => ({ ...prev, vendorId: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create vendor');
    } finally {
      setSavingVendor(false);
    }
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
        contractValue: form.contractValue ? parseFloat(form.contractValue) : 0,
        currency: form.currency || 'INR',
        paymentFrequency: form.paymentFrequency || 'ANNUAL',
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
    const val = e.target.value;
    if (field === 'vendorId' && val === '__ADD_NEW__') {
      setShowAddVendor(true);
      return;
    }
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header shrink-0">
          <h3 className="modal-title">{isEdit ? 'Edit Contract' : 'Add New Enterprise Contract'}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body overflow-y-auto space-y-6" style={{ flex: 1, paddingRight: '1rem' }}>
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
              <label className="form-label">Description & Scope</label>
              <textarea className="form-textarea" rows={2} value={form.description} onChange={set('description')} placeholder="Optional contract description, deliverables, SLA terms…" />
            </div>
          </div>

          <div className="divider" />

          {/* Vendor Section with Inline Add Option */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
                Vendor Selection
              </h4>
              <button
                type="button"
                onClick={() => setShowAddVendor(!showAddVendor)}
                className="btn btn-secondary btn-sm flex items-center gap-1 text-xs"
                style={{ color: 'var(--color-primary)' }}
              >
                <Plus size={13} /> {showAddVendor ? 'Close Vendor Form' : '+ Add New Vendor'}
              </button>
            </div>

            {/* Inline Vendor Add Form */}
            {showAddVendor && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 mb-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  <Building2 size={14} /> Register New Vendor
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label text-xs">Vendor Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="e.g., Snowflake Inc, GitHub, Cloudflare"
                      value={newVendorForm.name}
                      onChange={e => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Contact Person</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="e.g., Sarah Connor"
                      value={newVendorForm.contactPerson}
                      onChange={e => setNewVendorForm({ ...newVendorForm, contactPerson: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Email</label>
                    <input
                      type="email"
                      className="form-input text-xs"
                      placeholder="vendor@company.com"
                      value={newVendorForm.email}
                      onChange={e => setNewVendorForm({ ...newVendorForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Phone</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="+1 (555) 019-2834"
                      value={newVendorForm.phone}
                      onChange={e => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label text-xs">Company Address</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="Headquarters address"
                    value={newVendorForm.companyAddress}
                    onChange={e => setNewVendorForm({ ...newVendorForm, companyAddress: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-xs"
                    onClick={() => setShowAddVendor(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm text-xs flex items-center gap-1"
                    onClick={handleCreateVendor}
                    disabled={savingVendor}
                  >
                    {savingVendor ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                    Save & Select Vendor
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select Vendor <span className="required">*</span></label>
              <select className={`form-select ${errors.vendorId ? 'error' : ''}`} value={form.vendorId} onChange={set('vendorId')}>
                <option value="">— Choose vendor —</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} {v.contactPerson ? `(${v.contactPerson})` : ''}</option>
                ))}
                <option value="__ADD_NEW__">➕ Add New Vendor...</option>
              </select>
              {errors.vendorId && <span className="form-error">{errors.vendorId}</span>}
            </div>
          </div>

          <div className="divider" />

          {/* Commercial & Financial Terms */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Financial Terms & Commitment
            </h4>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Contract Value</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 500000"
                  value={form.contractValue}
                  onChange={set('contractValue')}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={form.currency} onChange={set('currency')}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Billing Frequency</label>
                <select className="form-select" value={form.paymentFrequency} onChange={set('paymentFrequency')}>
                  <option value="ANNUAL">Annual</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ONE_TIME">One-Time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Dates */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Contract Dates & Notice Period
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
                <span style={{ color: 'var(--text-secondary)' }}>Automated renewal review date:</span>
                <strong style={{ color: 'var(--color-primary)' }}>{reviewDate}</strong>
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Document */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Primary Document Reference (Optional)
            </h4>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input className="form-input" value={form.documentName} onChange={set('documentName')} placeholder="e.g., Master_Agreement.pdf" />
              </div>
              <div className="form-group">
                <label className="form-label">Reference URL / Cloud Path</label>
                <input className="form-input" value={form.documentReference} onChange={set('documentReference')} placeholder="https://drive.google.com/... or /docs/msa.pdf" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with high visibility */}
        <div className="modal-footer shrink-0 bg-slate-950/80 border-t border-slate-800 p-4 flex items-center justify-end gap-3">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="btn btn-primary shadow-lg shadow-indigo-600/30 flex items-center gap-2" 
            onClick={handleSubmit} 
            disabled={loading}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', fontWeight: 600 }}
          >
            {loading ? <><Loader size={14} className="animate-spin" /> Saving…</> : isEdit ? 'Update Contract' : 'Create Contract'}
          </button>
        </div>
      </div>
    </div>
  );
}
