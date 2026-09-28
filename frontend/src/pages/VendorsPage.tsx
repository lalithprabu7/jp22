import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Mail, Phone, ArrowRight, Trash2, Edit } from 'lucide-react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../services/contractService';
import type { Vendor } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchVendors = () => {
    setLoading(true);
    getVendors().then(setVendors).finally(() => setLoading(false));
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteId);
      toast.success('Vendor deleted.');
      fetchVendors();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">{vendors.length} vendors in the system</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditVendor(null); setShowForm(true); }}>
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading vendors…</div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Building2 size={28} /></div>
          <h3>No vendors yet</h3>
          <p>Add your first vendor to start creating contracts.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Add Vendor</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {vendors.map(v => (
            <div key={v.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 44, height: 44,
                    background: `hsl(${(v.id * 47) % 360}, 60%, 40%)`,
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: 800, color: 'white'
                  }}>
                    {v.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.name}</div>
                    {v.contactPerson && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.contactPerson}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => { setEditVendor(v); setShowForm(true); }}
                    title="Edit vendor"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => setDeleteId(v.id)}
                    title="Delete vendor"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {v.email && (
                  <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Mail size={12} /> {v.email}
                  </div>
                )}
                {v.phone && (
                  <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Phone size={12} /> {v.phone}
                  </div>
                )}
                {v.companyAddress && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    📍 {v.companyAddress}
                  </div>
                )}
              </div>

              {/* Contract Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Contracts</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{v.totalContracts}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>{v.activeContracts}</div>
                </div>
              </div>

              <button
                className="btn btn-ghost btn-sm w-full"
                onClick={() => navigate(`/contracts?vendor=${v.id}`)}
              >
                View Contracts <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <VendorFormModal
          vendor={editVendor}
          onClose={() => { setShowForm(false); setEditVendor(null); }}
          onSuccess={() => { setShowForm(false); setEditVendor(null); fetchVendors(); }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Vendor"
          message="Are you sure you want to delete this vendor? All associated contracts will also be removed."
          confirmLabel="Delete"
          confirmClass="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ─── Vendor Form Modal ────────────────────────────────────────────────────────
interface VendorFormModalProps {
  vendor: Vendor | null;
  onClose: () => void;
  onSuccess: () => void;
}

function VendorFormModal({ vendor, onClose, onSuccess }: VendorFormModalProps) {
  const [form, setForm] = useState({
    name: vendor?.name ?? '',
    contactPerson: vendor?.contactPerson ?? '',
    email: vendor?.email ?? '',
    phone: vendor?.phone ?? '',
    companyAddress: vendor?.companyAddress ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vendor name is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (vendor) {
        await updateVendor(vendor.id, form);
        toast.success('Vendor updated successfully.');
      } else {
        await createVendor(form);
        toast.success('Vendor created successfully.');
      }
      onSuccess();
    } finally { setLoading(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Vendor Name <span className="required">*</span></label>
            <input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name} onChange={set('name')} placeholder="e.g., Amazon Web Services" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-input" value={form.contactPerson} onChange={set('contactPerson')} placeholder="e.g., John Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+1-800-000-0000" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className={`form-input ${errors.email ? 'error' : ''}`} value={form.email} onChange={set('email')} placeholder="contact@vendor.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Company Address</label>
            <textarea className="form-textarea" value={form.companyAddress} onChange={set('companyAddress')} placeholder="Full company address…" style={{ minHeight: 60 }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : vendor ? 'Update Vendor' : 'Add Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}
