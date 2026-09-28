import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Search, FileText, ArrowUpRight } from 'lucide-react';
import { getAllDocuments } from '../services/contractService';
import type { DocumentDto } from '../types';
import { formatDateTime } from '../utils/formatters';

const DOC_TYPES = ['ALL', 'CONTRACT', 'INVOICE', 'AGREEMENT', 'AMENDMENT', 'COMPLIANCE', 'OTHER'];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    getAllDocuments()
      .then(docs => setDocuments(docs))
      .catch(err => console.error('Failed to load documents', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesType = selectedType === 'ALL' || doc.type === selectedType;
      const matchesSearch = 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.contractName && doc.contractName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.contractNumber && doc.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.uploadedBy && doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [documents, selectedType, searchQuery]);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'CONTRACT':
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
      case 'AGREEMENT':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'INVOICE':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'AMENDMENT':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'COMPLIANCE':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.08)', text: 'var(--text-secondary)', border: 'rgba(255, 255, 255, 0.1)' };
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
              <FolderOpen size={18} />
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-light)' }}>
              Document Vault
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800 }}>Contract Document Repository</h1>
          <p className="page-subtitle">
            Centralized document references, counterparty execution copies, invoices, addendums, and compliance proofs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ 
            fontSize: '0.78rem', padding: '0.35rem 0.85rem', borderRadius: '10px', 
            background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-secondary)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 600, fontFamily: 'monospace'
          }}>
            {documents.length} Total Documents
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search documents by title, contract name, or author..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px' }}
          />
        </div>

        {/* Type Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {DOC_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`btn btn-sm ${selectedType === type ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '8px', fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Loading document records...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={28} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No documents found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0.5rem auto 1.25rem' }}>
            No documents matched your filter or search query. Try switching to "ALL" or adjusting your keywords.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.25rem' }}>Document Name</th>
                  <th>Classification</th>
                  <th>Associated Contract</th>
                  <th>Version</th>
                  <th>Uploaded By</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Access Link</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const style = getTypeStyle(doc.type);
                  return (
                    <tr key={doc.id}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '10px',
                            background: style.bg, color: style.text, border: `1px solid ${style.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <FileText size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {doc.name}
                            </div>
                            {doc.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                                {doc.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ 
                          fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '6px', 
                          background: style.bg, color: style.text, border: `1px solid ${style.border}`,
                          fontWeight: 700, letterSpacing: '0.04em'
                        }}>
                          {doc.type}
                        </span>
                      </td>

                      <td>
                        <button
                          onClick={() => navigate(`/contracts/${doc.contractId}`)}
                          style={{
                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                            color: 'var(--color-primary-light)', fontWeight: 600, fontSize: '0.85rem',
                            textAlign: 'left', display: 'block'
                          }}
                          className="hover:underline"
                        >
                          {doc.contractName || `Contract #${doc.contractId}`}
                        </button>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                          {doc.contractNumber}
                        </span>
                      </td>

                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, 
                          color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.04)',
                          padding: '0.15rem 0.5rem', borderRadius: '4px'
                        }}>
                          v{doc.version || '1.0'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {doc.uploadedBy || 'Admin'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                          {formatDateTime(doc.uploadedAt)}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        <a
                          href={doc.reference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                        >
                          Open <ArrowUpRight size={13} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
