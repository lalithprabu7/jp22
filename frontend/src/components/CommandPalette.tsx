import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Building2, FolderOpen, ArrowRight, X } from 'lucide-react';
import { globalSearch } from '../services/contractService';
import type { GlobalSearchResponse } from '../types';
import StatusBadge from './StatusBadge';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalSearch(query);
        setResults(res);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectContract = (id: number) => {
    navigate(`/contracts/${id}`);
    onClose();
  };

  const handleSelectVendor = (id: number) => {
    navigate(`/vendors?id=${id}`);
    onClose();
  };

  const handleSelectDoc = (ref: string) => {
    window.open(ref, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const hasResults = results && (
    results.contracts.length > 0 || results.vendors.length > 0 || results.documents.length > 0
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Input */}
        <div className="relative flex items-center px-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contracts, vendors, documents (e.g. AWS, SLA, CW-2026)..."
            className="w-full py-4 bg-transparent text-slate-100 placeholder-slate-500 text-base focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 mr-2 text-slate-400 hover:text-slate-200"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
          <button 
            onClick={onClose}
            className="ml-3 p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && (
            <div className="py-8 text-center text-sm text-slate-400">
              Searching database records...
            </div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center text-slate-500 text-sm">
              <p className="font-medium text-slate-400">Search ContractWatch Platform</p>
              <p className="text-xs mt-1">Type at least 2 characters to search across all contracts, vendors, and MSAs.</p>
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="py-8 text-center text-slate-500 text-sm">
              No matching contracts, vendors, or documents found for "{query}".
            </div>
          )}

          {!loading && hasResults && (
            <>
              {/* Contracts */}
              {results.contracts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Contracts ({results.contracts.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.contracts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectContract(c.id)}
                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors border border-transparent hover:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                              {c.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              {c.contractNumber} • {c.vendorName}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={c.status} />
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendors */}
              {results.vendors.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Vendors ({results.vendors.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.vendors.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleSelectVendor(v.id)}
                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors border border-transparent hover:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                              {v.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {v.contactPerson || v.email}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {v.activeContracts} active contracts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {results.documents.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-400" /> Documents ({results.documents.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.documents.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => handleSelectDoc(d.reference)}
                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors border border-transparent hover:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <FolderOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                              {d.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {d.contractName || d.contractNumber} • v{d.version}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-indigo-400 group-hover:underline">
                          Open Link ↗
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Navigate with <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">↓</kbd></span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Ctrl + K</kbd> anytime to open</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
