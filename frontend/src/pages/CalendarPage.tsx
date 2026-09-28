import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, AlertTriangle, 
  ExternalLink, CalendarDays, ListFilter
} from 'lucide-react';
import { getContracts } from '../services/contractService';
import type { Contract } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/formatters';

interface CalendarEvent {
  id: number;
  contract: Contract;
  dateStr: string; // YYYY-MM-DD
  type: 'EXPIRY' | 'REVIEW';
  title: string;
}

export const CalendarPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'MONTH' | 'LIST'>('MONTH');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getContracts();
      setContracts(data);
    } catch (err) {
      console.error('Failed to load contracts for calendar', err);
    } finally {
      setLoading(false);
    }
  };

  // Compile calendar events from contracts
  const events: CalendarEvent[] = [];
  contracts.forEach((c) => {
    if (c.endDate) {
      events.push({
        id: c.id,
        contract: c,
        dateStr: c.endDate,
        type: 'EXPIRY',
        title: `${c.title} (Expires)`
      });
    }
    if (c.renewalReviewDate) {
      events.push({
        id: c.id,
        contract: c,
        dateStr: c.renewalReviewDate,
        type: 'REVIEW',
        title: `${c.title} (Review Notice)`
      });
    }
  });

  // Calendar month math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
        <p>Loading enterprise contract calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-400" />
            Contract Renewal Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track upcoming renewal review deadlines and expiration dates across the enterprise portfolio.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'MONTH' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Month View
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'LIST' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Agenda List
            </button>
          </div>
        </div>
      </div>

      {/* Month Navigator Header */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-200">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={todayMonth}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'MONTH' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px] mb-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[105px] rounded-xl bg-slate-950/40 border border-slate-900/60 p-2 opacity-30" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.dateStr === dateStr);

              const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[105px] rounded-xl border p-2 flex flex-col justify-between transition-colors ${
                    isToday 
                      ? 'bg-indigo-950/30 border-indigo-500/50' 
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    )}
                  </div>

                  {/* Day Events */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev, evIdx) => (
                      <div
                        key={evIdx}
                        onClick={() => navigate(`/contracts/${ev.id}`)}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer font-medium transition-opacity hover:opacity-80 ${
                          ev.type === 'EXPIRY'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                        title={ev.title}
                      >
                        {ev.type === 'EXPIRY' ? '🔴 Expiry: ' : '⏱ Review: '}
                        {ev.contract.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-500 font-mono pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda List View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-800">
            {events
              .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
              .map((ev, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/contracts/${ev.id}`)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      ev.type === 'EXPIRY' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {ev.type === 'EXPIRY' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">
                          {ev.contract.title}
                        </span>
                        <StatusBadge status={ev.contract.status} />
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {ev.contract.contractNumber} • {ev.contract.vendorName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-mono font-medium text-slate-300">
                        {formatDate(ev.dateStr)}
                      </div>
                      <div className={`text-[11px] font-semibold ${
                        ev.type === 'EXPIRY' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {ev.type === 'EXPIRY' ? 'Expiration Deadline' : 'Notice Window Start'}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
