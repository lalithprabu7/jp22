import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Building2, Mail, Phone, ArrowRight, Trash2, 
  Edit, Search, FileText, CheckCircle2, MapPin
} from 'lucide-react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../services/contractService';
import type { Vendor } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchVendors = () => {
    setLoading(true);
    getVendors()
      .then(setVendors)
      .catch(() => toast.error('Failed to load vendors'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchVendors(); 
  }, []);

  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter(v => 
      v.name.toLowerCase().includes(q) ||
      (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
      (v.email && v.email.toLowerCase().includes(q)) ||
      (v.companyAddress && v.companyAddress.toLowerCase().includes(q))
    );
  }, [vendors, searchQuery]);

  const totalContractsCount = useMemo(() => 
    vendors.reduce((acc, v) => acc + (v.totalContracts || 0), 0),
    [vendors]
  );

  const activeContractsCount = useMemo(() => 
    vendors.reduce((acc, v) => acc + (v.activeContracts || 0), 0),
    [vendors]
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteId);
      toast.success('Vendor deleted successfully.');
      fetchVendors();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete vendor.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: 32, height: 32, borderRadius: '10px', 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8'
            }}>
              <Building2 size={18} />
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-light)' }}>
              Partner Directory
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800 }}>Vendor Ecosystem</h1>
          <p className="page-subtitle">
            Manage enterprise suppliers, counterparty relationships, contact points, and active contract allocations.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => { setEditVendor(null); setShowForm(true); }}
          style={{ boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.4)' }}
        >
          <Plus size={16} /> Add Partner Vendor
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Vendors</span>
            <Building2 size={18} style={{ color: '#818cf8' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            {vendors.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            Active corporate counterparties
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Engagements</span>
            <FileText size={18} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.4rem' }}>
            {totalContractsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            Cumulative contracts executed
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Contracts</span>
            <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.4rem' }}>
            {activeContractsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            Currently live agreements
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search vendors by name, contact person, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px' }}
          />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Showing <span style={{ color: 'var(--color-primary-light)' }}>{filteredVendors.length}</span> of {vendors.length} vendors
        </div>
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>Loading partner vendors...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Building2 size={28} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No vendors match your search</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0.5rem auto 1.25rem' }}>
            {searchQuery ? `No vendor records matched "${searchQuery}". Clear your search query or add a new vendor.` : 'Add your first vendor counterparty to start creating contracts.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => { setSearchQuery(''); setShowForm(true); }}>
            <Plus size={14} /> Add Partner Vendor
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredVendors.map(v => {
            const initial = v.name ? v.name.charAt(0).toUpperCase() : 'V';
            const hue = (v.id * 53) % 360;

            return (
              <div 
                key={v.id} 
                className="card" 
                style={{ 
                  display: 'flex', flexDirection: 'column', gap: '1.1rem',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                {/* Ambient top border tint */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, hsl(${hue}, 80%, 65%), transparent)`
                }} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: 48, height: 48,
                      background: `linear-gradient(135deg, hsl(${hue}, 70%, 35%), hsl(${hue}, 80%, 20%))`,
                      border: `1px solid hsl(${hue}, 80%, 50%, 0.4)`,
                      boxShadow: `0 8px 16px -4px hsla(${hue}, 80%, 40%, 0.35)`,
                      borderRadius: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem', fontWeight: 800, color: 'white',
                      flexShrink: 0
                    }}>
                      {initial}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        {v.name}
                      </div>
                      {v.contactPerson ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
                          {v.contactPerson}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No contact assigned</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => { setEditVendor(v); setShowForm(true); }}
                      title="Edit vendor profile"
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

                {/* Contact Coordinates */}
                <div style={{ 
                  display: 'flex', flexDirection: 'column', gap: '0.45rem', 
                  padding: '0.75rem 0.9rem', borderRadius: '12px', 
                  background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' 
                }}>
                  {v.email ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Mail size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
                      <a href={`mailto:${v.email}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="hover:text-indigo-400">
                        {v.email}
                      </a>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No email registered</div>
                  )}

                  {v.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Phone size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                      <span>{v.phone}</span>
                    </div>
                  )}

                  {v.companyAddress && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                      <MapPin size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ lineHeight: 1.4 }}>{v.companyAddress}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Pill Grid */}
                <div style={{ 
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', 
                  paddingTop: '0.85rem', borderTop: '1px solid var(--color-border)' 
                }}>
                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Total Contracts
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                      {v.totalContracts || 0}
                    </div>
                  </div>

                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Active Live
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '0.1rem' }}>
                      {v.activeContracts || 0}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                  onClick={() => navigate(`/contracts?vendor=${v.id}`)}
                >
                  View Contracts ({v.totalContracts || 0}) <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <VendorFormModal
          vendor={editVendor}
          onClose={() => { setShowForm(false); setEditVendor(null); }}
          onSuccess={() => { setShowForm(false); setEditVendor(null); fetchVendors(); }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Vendor Record"
          message="Are you sure you want to delete this vendor? Contracts assigned to this vendor will have their vendor reference removed."
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
        toast.success('Vendor profile updated.');
      } else {
        await createVendor(form);
        toast.success('Vendor partner registered.');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save vendor');
    } finally { 
      setLoading(false); 
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ 
              width: 34, height: 34, borderRadius: '10px', 
              background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8'
            }}>
              <Building2 size={18} />
            </span>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>{vendor ? 'Edit Vendor Profile' : 'Register New Vendor'}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                {vendor ? 'Update company details and contact points' : 'Add counterparty to contract portfolio'}
              </p>
            </div>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Vendor / Company Name <span className="required">*</span></label>
            <input 
              className={`form-input ${errors.name ? 'error' : ''}`} 
              value={form.name} 
              onChange={set('name')} 
              placeholder="e.g., Amazon Web Services (AWS)" 
              autoFocus
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input 
                className="form-input" 
                value={form.contactPerson} 
                onChange={set('contactPerson')} 
                placeholder="e.g., Sarah Jenkins" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Direct Phone</label>
              <input 
                className="form-input" 
                value={form.phone} 
                onChange={set('phone')} 
                placeholder="+1 (800) 555-0199" 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Official Email</label>
            <input 
              className={`form-input ${errors.email ? 'error' : ''}`} 
              value={form.email} 
              onChange={set('email')} 
              placeholder="billing@partner.com" 
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Headquarters / Billing Address</label>
            <textarea 
              className="form-textarea" 
              value={form.companyAddress} 
              onChange={set('companyAddress')} 
              placeholder="410 Terry Ave N, Seattle, WA 98109, United States" 
              rows={2} 
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : vendor ? 'Update Vendor' : 'Create Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}
