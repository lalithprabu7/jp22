import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Building2, Mail, Phone, Trash2,
  Edit, Search, FileText, CheckCircle2, MapPin, ChevronRight
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

  useEffect(() => { fetchVendors(); }, []);

  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
      (v.email && v.email.toLowerCase().includes(q))
    );
  }, [vendors, searchQuery]);

  const totalContracts = useMemo(() => vendors.reduce((a, v) => a + (v.totalContracts || 0), 0), [vendors]);
  const activeContracts = useMemo(() => vendors.reduce((a, v) => a + (v.activeContracts || 0), 0), [vendors]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteId);
      toast.success('Vendor deleted.');
      fetchVendors();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete vendor.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  // Generate a stable hue from vendor id
  const hue = (id: number) => (id * 67) % 360;

  return (
    <div className="space-y-6 pb-12">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Vendors</h1>
          </div>
          <p className="text-sm text-slate-400 ml-[52px]">
            {vendors.length} partners &nbsp;·&nbsp; {filteredVendors.length} shown
          </p>
        </div>
        <button
          onClick={() => { setEditVendor(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_28px_rgba(99,102,241,0.5)] hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus size={18} /> Add Vendor
        </button>
      </div>

      {/* ─── KPI Strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Partners', value: vendors.length, color: 'text-white', icon: Building2, bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { label: 'Total Contracts', value: totalContracts, color: 'text-cyan-400', icon: FileText, bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
          { label: 'Active Contracts', value: activeContracts, color: 'text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl bg-[#0c101b] border ${k.border} p-5`}>
            <div className={`w-9 h-9 rounded-xl ${k.bg} border ${k.border} flex items-center justify-center mb-4`}>
              <k.icon size={18} className={k.color} />
            </div>
            <div className={`text-3xl font-bold mb-1 ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Search ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        <input
          className="w-full pl-11 pr-4 py-3 bg-[#0c101b] border border-white/5 rounded-2xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all"
          placeholder="Search vendors by name, contact, or email…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ─── Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading vendors…</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 rounded-2xl bg-[#0c101b] border border-white/5">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Building2 size={28} className="text-slate-500" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-white">No vendors found</h3>
            <p className="text-sm text-slate-500 mt-1">{searchQuery ? `No results for "${searchQuery}"` : 'Add your first vendor to get started'}</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
            onClick={() => { setSearchQuery(''); setShowForm(true); }}
          >
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredVendors.map(v => {
            const initial = v.name.charAt(0).toUpperCase();
            const h = hue(v.id);
            return (
              <div
                key={v.id}
                className="group relative overflow-hidden rounded-2xl bg-[#0c101b] border border-white/5 hover:border-white/10 transition-all flex flex-col"
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, hsl(${h}, 70%, 55%), transparent)` }}
                />

                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, hsl(${h},70%,35%), hsl(${h},80%,20%))`,
                          boxShadow: `0 8px 20px -4px hsla(${h},70%,40%,0.4)`
                        }}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-base leading-tight truncate">{v.name}</div>
                        {v.contactPerson ? (
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            {v.contactPerson}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-600 mt-0.5">No contact</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        onClick={() => { setEditVendor(v); setShowForm(true); }}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                        onClick={() => setDeleteId(v.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    {v.email ? (
                      <a href={`mailto:${v.email}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-400 transition-colors">
                        <Mail size={12} className="text-indigo-400 shrink-0" />
                        <span className="truncate">{v.email}</span>
                      </a>
                    ) : <div className="text-xs text-slate-600">No email</div>}
                    {v.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone size={12} className="text-cyan-400 shrink-0" />
                        {v.phone}
                      </div>
                    )}
                    {v.companyAddress && (
                      <div className="flex items-start gap-2 text-xs text-slate-500">
                        <MapPin size={12} className="text-amber-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{v.companyAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-slate-600 uppercase tracking-wider font-bold mb-1">Total</div>
                      <div className="text-2xl font-bold text-white">{v.totalContracts || 0}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                      <div className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold mb-1">Active</div>
                      <div className="text-2xl font-bold text-emerald-400">{v.activeContracts || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <button
                  className="flex items-center justify-between px-5 py-3 border-t border-white/5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.02] transition-all group/btn"
                  onClick={() => navigate(`/contracts?vendor=${v.id}`)}
                >
                  <span>View Contracts</span>
                  <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
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
          message="Delete this vendor? Contracts assigned will have their vendor reference removed."
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

// ─── Vendor Form Modal ─────────────────────────────────────────────────────────
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
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vendor name is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (vendor) {
        await updateVendor(vendor.id, form);
        toast.success('Vendor updated.');
      } else {
        await createVendor(form);
        toast.success('Vendor created.');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save vendor');
    } finally { setSaving(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-[#0c101b] border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Building2 size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
              <p className="text-xs text-slate-500">{vendor ? 'Update company details' : 'Register a new counterparty'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Name <span className="text-rose-400">*</span></label>
            <input
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition-all ${errors.name ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-indigo-500/50'}`}
              value={form.name}
              onChange={set('name')}
              placeholder="e.g., Amazon Web Services"
              autoFocus
            />
            {errors.name && <p className="text-xs text-rose-400">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Person</label>
              <input className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all" value={form.contactPerson} onChange={set('contactPerson')} placeholder="Sarah Jenkins" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
              <input className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all" value={form.phone} onChange={set('phone')} placeholder="+1 800 555 0199" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
            <input
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition-all ${errors.email ? 'border-rose-500/50' : 'border-white/10 focus:border-indigo-500/50'}`}
              value={form.email}
              onChange={set('email')}
              placeholder="billing@company.com"
            />
            {errors.email && <p className="text-xs text-rose-400">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</label>
            <textarea
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
              value={form.companyAddress}
              onChange={set('companyAddress')}
              placeholder="410 Terry Ave N, Seattle, WA 98109"
              rows={2}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-black/20">
          <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-40"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving…' : vendor ? 'Update Vendor' : 'Create Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}
