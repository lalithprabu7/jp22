import { useEffect, useState } from 'react';
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

  const filteredDocs = documents.filter(doc => {
    const matchesType = selectedType === 'ALL' || doc.type === selectedType;
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.contractName && doc.contractName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.contractNumber && doc.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.uploadedBy && doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'CONTRACT': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'AGREEMENT': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'INVOICE': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'AMENDMENT': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'COMPLIANCE': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FolderOpen className="w-7 h-7 text-indigo-400" />
            Contract Document Repository
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized document storage, amendments, invoices, and compliance references.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
            {documents.length} Total Documents
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents or contracts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Type Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {DOC_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedType === type
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading document records...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
          <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-300">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or type filter.</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="py-3.5 px-4">Document</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Contract</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Uploaded By</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{doc.name}</div>
                          {doc.description && (
                            <div className="text-xs text-slate-400 line-clamp-1">{doc.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getTypeBadgeClass(doc.type)}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => navigate(`/contracts/${doc.contractId}`)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline text-left block"
                      >
                        {doc.contractName || `Contract #${doc.contractId}`}
                      </button>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {doc.contractNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      v{doc.version || '1.0'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-300">{doc.uploadedBy || 'Admin'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{formatDateTime(doc.uploadedAt)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={doc.reference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700/60"
                      >
                        Open <ArrowUpRight size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
