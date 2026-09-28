import React from 'react';
import type { AuditEventDto } from '../types';
import { 
  PlusCircle, FileText, Clock, CheckCircle2, XCircle, RefreshCw, AlertTriangle
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

interface AuditTimelineProps {
  events: AuditEventDto[];
  loading?: boolean;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'CONTRACT_CREATED':
      return <PlusCircle className="w-5 h-5 text-emerald-400" />;
    case 'DOCUMENT_ADDED':
      return <FileText className="w-5 h-5 text-blue-400" />;
    case 'RENEWAL_WINDOW_STARTED':
      return <Clock className="w-5 h-5 text-amber-400" />;
    case 'RENEWAL_REVIEWED':
      return <AlertTriangle className="w-5 h-5 text-cyan-400" />;
    case 'CONTRACT_RENEWED':
      return <CheckCircle2 className="w-5 h-5 text-teal-400" />;
    case 'CONTRACT_TERMINATED':
      return <XCircle className="w-5 h-5 text-rose-400" />;
    case 'STATUS_CHANGED':
    default:
      return <RefreshCw className="w-5 h-5 text-indigo-400" />;
  }
};

const formatEventType = (type: string) => {
  return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
};

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events, loading = false }) => {
  if (loading) {
    return (
      <div className="py-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
        <p className="text-sm">Loading audit event timeline...</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400">
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-medium">No audit events logged yet.</p>
        <p className="text-xs text-slate-500 mt-1">Actions on this contract will automatically appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
      {events.map((evt) => (
        <div key={evt.id} className="relative group">
          {/* Timeline Dot with Icon */}
          <div className="absolute -left-6 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 border border-slate-800 group-hover:border-indigo-500/50 transition-colors shadow-sm">
            {getEventIcon(evt.eventType)}
          </div>

          <div className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-sm text-slate-200">
                {formatEventType(evt.eventType)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {formatDateTime(evt.createdAt)}
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {evt.description}
            </p>

            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-slate-500">Performed by:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800/80 font-medium text-slate-300">
                {evt.performedBy || 'System'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditTimeline;
