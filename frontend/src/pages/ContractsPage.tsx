import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, ExternalLink, Trash2, Eye } from 'lucide-react';
import { getContracts, deleteContract } from '../services/contractService';
import type { Contract, ContractStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import ContractFormModal from '../components/ContractFormModal';
import { formatDate, getDaysLabel, getUrgencyColor } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_FILTERS: { label: string; value: ContractStatus | 'ALL' | 'EXPIRING' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Renewal Due', value: 'RENEWAL_DUE' },
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
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contracts</h1>
          <p className="page-subtitle">{contracts.length} contracts in the system</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Contract
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            className="form-input"
            placeholder="Search by title, number, or vendor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              className={`filter-tab ${statusFilter === f.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading contracts…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={28} /></div>
            <h3>No contracts found</h3>
            <p>Try adjusting your search or filter, or add a new contract.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Add Contract
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Contract</th>
                <th>Vendor</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Notice Period</th>
                <th>Renewal Review</th>
                <th>Status</th>
                <th>Days Left</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.contractNumber}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.vendorName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(c.startDate)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(c.endDate)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.renewalNoticeDays} days</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(c.renewalReviewDate)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      color: getUrgencyColor(c.daysUntilExpiry)
                    }}>
                      {c.daysUntilExpiry >= 0 ? getDaysLabel(c.daysUntilExpiry) : 'Expired'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => navigate(`/contracts/${c.id}`)}
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                      {c.documentReference && (
                        <a
                          href={c.documentReference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm btn-icon"
                          title="Open document"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => setDeleteId(c.id)}
                        title="Delete contract"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
          message="Are you sure you want to permanently delete this contract? This action cannot be undone."
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
