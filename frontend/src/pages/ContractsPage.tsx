import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, ExternalLink, Trash2, Eye, 
  Building2, RefreshCw 
} from 'lucide-react';
import { getContracts, deleteContract } from '../services/contractService';
import type { Contract, ContractStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import ContractFormModal from '../components/ContractFormModal';
import { formatDate, getDaysLabel, getUrgencyColor, formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_FILTERS: { label: string; value: ContractStatus | 'ALL' | 'EXPIRING' }[] = [
  { label: 'All Contracts', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Renewal Due', value: 'RENEWAL_DUE' },
  { label: 'Expiring in 30d', value: 'EXPIRING' },
  { label: 'Renewed', value: 'RENEWED' },
  { label: 'Terminated', value: 'TERMINATED' },
  { label: 'Expired', value: 'EXPIRED' },
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
      toast.success('Contract deleted successfully.');
      fetchContracts();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Enterprise Contracts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {contracts.length} active enterprise commitments, vendor terms, and notice period trackers.
          </p>
        </div>
        <button 
          className="btn btn-primary shadow-lg shadow-indigo-600/30 flex items-center gap-2" 
          onClick={() => setShowForm(true)}
          style={{ padding: '0.65rem 1.4rem', fontSize: '0.875rem', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Contract
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
            placeholder="Search by title, contract number, or vendor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === f.value 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
            Loading enterprise contracts repository...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Search size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-200">No matching contracts found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or status filter to see other records.
            </p>
            <button className="btn btn-primary btn-sm mt-4" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Add New Contract
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Contract & Identifier</th>
                <th>Vendor</th>
                <th>Runway</th>
                <th>Notice Period</th>
                <th>Renewal Review</th>
                <th>Value</th>
                <th>Risk Engine</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const urgency = getUrgencyColor(c.daysUntilExpiry);
                return (
                  <tr 
                    key={c.id} 
                    className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                    onClick={() => navigate(`/contracts/${c.id}`)}
                  >
                    <td>
                      <div className="font-semibold text-slate-100">{c.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.contractNumber}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium text-xs">
                        <Building2 size={13} className="text-slate-500" />
                        <span>{c.vendorName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-bold font-mono" style={{ color: urgency }}>
                        {c.daysUntilExpiry >= 0 ? getDaysLabel(c.daysUntilExpiry) : 'Expired'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">End: {formatDate(c.endDate)}</div>
                    </td>
                    <td className="text-xs text-slate-300 font-mono">
                      {c.renewalNoticeDays} days
                    </td>
                    <td className="text-xs font-mono text-amber-400/90 font-medium">
                      {formatDate(c.renewalReviewDate)}
                    </td>
                    <td className="font-mono text-slate-200 font-semibold text-xs">
                      {formatCurrency(c.contractValue, c.currency)}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.riskLevel === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        c.riskLevel === 'HIGH' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        c.riskLevel === 'MEDIUM' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {c.riskLevel || 'LOW'} ({c.riskScore || 0})
                      </span>
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          onClick={() => navigate(`/contracts/${c.id}`)}
                          title="Inspect Details"
                        >
                          <Eye size={14} />
                        </button>
                        {c.documentReference && (
                          <a
                            href={c.documentReference}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Open Document Reference"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          onClick={() => setDeleteId(c.id)}
                          title="Delete Contract"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ContractFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchContracts(); }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Contract"
          message="Are you sure you want to permanently delete this contract? This will remove all associated documents, decisions, and audit events."
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
