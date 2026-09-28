import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, ExternalLink, Plus } from 'lucide-react';
import { getContracts } from '../services/contractService';
import type { Contract } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/formatters';

export default function DocumentsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getContracts()
      .then(cs => setContracts(cs.filter(c => c.documentReference)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📁 Document References</h1>
          <p className="page-subtitle">{contracts.length} contracts with document references</p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading documents…</div>
      ) : contracts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={28} /></div>
          <h3>No document references yet</h3>
          <p>Attach document references to your contracts to access them here.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/contracts')}>
            <Plus size={14} /> Go to Contracts
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Contract</th>
                <th>Vendor</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FolderOpen size={16} color="var(--color-warning)" />
                      <div>
                        <div style={{ fontWeight: 600 }}>📄 {c.documentName || 'Contract Document'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: 250 }} className="truncate">
                          {c.documentReference}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--color-primary)' }}
                      onClick={() => navigate(`/contracts/${c.id}`)}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.contractNumber}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.vendorName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(c.endDate)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <a
                        href={c.documentReference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                      >
                        <ExternalLink size={14} /> Open
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
