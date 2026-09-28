import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, ExternalLink, Trash2,
  Building2, RefreshCw, FileText, SlidersHorizontal,
  ChevronRight, ShieldAlert
} from 'lucide-react';
import { getContracts, deleteContract } from '../services/contractService';
import type { Contract, ContractStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import ContractFormModal from '../components/ContractFormModal';
import { formatDate, getDaysLabel, getUrgencyColor, formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_FILTERS: { label: string; value: ContractStatus | 'ALL' | 'EXPIRING'; color?: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE', color: '#10b981' },
  { label: 'Renewal Due', value: 'RENEWAL_DUE', color: '#f59e0b' },
  { label: 'Expiring 30d', value: 'EXPIRING', color: '#f43f5e' },
  { label: 'Renewed', value: 'RENEWED', color: '#0ea5e9' },
  { label: 'Terminated', value: 'TERMINATED', color: '#64748b' },
  { label: 'Expired', value: 'EXPIRED', color: '#ef4444' },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'expiring') setStatusFilter('EXPIRING');
    if (filter === 'active') setStatusFilter('ACTIVE');
  }, [searchParams]);

  const fetchContracts = () => {
    setLoading(true);
    getContracts()
      .then(setContracts)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContracts(); }, []);

  const filtered = useMemo(() => {
    const today = new Date();
    const future30 = new Date(today);
    future30.setDate(today.getDate() + 30);

    return contracts.filter(c => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.vendorName.toLowerCase().includes(search.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'EXPIRING') {
        const end = new Date(c.endDate);
        matchesStatus = end >= today && end <= future30 && c.status !== 'TERMINATED';
      } else if (statusFilter !== 'ALL') {
        matchesStatus = c.status === statusFilter;
      }
      return matchesSearch && matchesStatus;
    });
  }, [contracts, search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteContract(deleteId);
      toast.success('Contract deleted.');
      fetchContracts();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Contracts
            </h1>
          </div>
          <p className="text-sm text-slate-400 ml-[52px]">
            {contracts.length} commitments tracked &nbsp;·&nbsp; {filtered.length} shown
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_28px_rgba(99,102,241,0.5)] hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus size={18} /> New Contract
        </button>
      </div>

      {/* ─── Search + Filter Bar ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-2xl bg-[#0c101b] border border-white/5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
            placeholder="Search by title, contract #, or vendor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <SlidersHorizontal size={14} className="text-slate-500 mr-1" />
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                statusFilter === f.value
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-sm'
                  : 'bg-transparent text-slate-400 border-transparent hover:border-white/10 hover:text-slate-200'
              }`}
            >
              {f.value !== 'ALL' && f.color && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                  style={{ backgroundColor: f.color }}
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0c101b] border border-white/5 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-400" />
            <p className="text-sm text-slate-400">Loading contracts…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
              <Search size={28} className="text-slate-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No contracts found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Try adjusting your filters or create your first contract.
              </p>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} /> New Contract
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contract</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Vendor</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Runway</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Value</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Risk</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="py-3.5 px-5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map(c => {
                  const urgency = getUrgencyColor(c.daysUntilExpiry);
                  return (
                    <tr
                      key={c.id}
                      className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => navigate(`/contracts/${c.id}`)}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center shrink-0">
                            <FileText size={16} className="text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors leading-tight">{c.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.contractNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-300 font-medium">
                          <Building2 size={13} className="text-slate-500 shrink-0" />
                          {c.vendorName}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm font-bold" style={{ color: urgency }}>
                          {c.daysUntilExpiry >= 0 ? getDaysLabel(c.daysUntilExpiry) : 'Expired'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{formatDate(c.endDate)}</div>
                      </td>
                      <td className="py-4 px-5 text-sm font-bold font-mono text-slate-200">
                        {formatCurrency(c.contractValue, c.currency)}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider ${
                          c.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          c.riskLevel === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          c.riskLevel === 'MEDIUM' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          <ShieldAlert size={11} />
                          {c.riskLevel || 'LOW'}
                        </span>
                      </td>
                      <td className="py-4 px-5"><StatusBadge status={c.status} /></td>
                      <td className="py-4 px-5 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="p-2 rounded-xl bg-white/5 hover:bg-indigo-500 hover:text-white text-slate-400 transition-all"
                            onClick={() => navigate(`/contracts/${c.id}`)}
                            title="View Details"
                          >
                            <ChevronRight size={15} />
                          </button>
                          {c.documentReference && (
                            <a
                              href={c.documentReference}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all"
                              title="Open Document"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}
                          <button
                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                            onClick={() => setDeleteId(c.id)}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-slate-600">
          Showing {filtered.length} of {contracts.length} contracts
        </p>
      )}

      {showForm && (
        <ContractFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchContracts(); }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Contract"
          message="Permanently delete this contract and all associated documents, decisions, and audit events?"
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
