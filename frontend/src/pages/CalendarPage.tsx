import { useEffect, useState, useMemo } from 'react';
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
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];
    contracts.forEach((c) => {
      if (c.endDate) {
        list.push({
          id: c.id,
          contract: c,
          dateStr: c.endDate,
          type: 'EXPIRY',
          title: `${c.title} (Expiry)`
        });
      }
      if (c.renewalReviewDate) {
        list.push({
          id: c.id,
          contract: c,
          dateStr: c.renewalReviewDate,
          type: 'REVIEW',
          title: `${c.title} (Review Notice)`
        });
      }
    });
    return list;
  }, [contracts]);

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

  const monthEventsCount = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return events.filter(e => e.dateStr.startsWith(prefix)).length;
  }, [events, year, month]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Loading enterprise contract calendar...</p>
      </div>
    );
  }

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
              <CalendarIcon size={18} />
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-light)' }}>
              Contract Schedule
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800 }}>Renewal & Expiry Calendar</h1>
          <p className="page-subtitle">
            Timeline overview of upcoming review notification windows and legal expiration deadlines.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            display: 'flex', background: 'rgba(0, 0, 0, 0.35)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '3px' 
          }}>
            <button
              onClick={() => setViewMode('MONTH')}
              className={`btn btn-sm ${viewMode === 'MONTH' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '9px', fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              <CalendarDays size={14} /> Month Grid
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`btn btn-sm ${viewMode === 'LIST' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '9px', fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              <ListFilter size={14} /> Agenda Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Month Navigator Toolbar */}
      <div className="card" style={{ 
        padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', 
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {monthNames[month]} {year}
          </h2>
          <span style={{ 
            fontSize: '0.72rem', padding: '0.2rem 0.65rem', borderRadius: '20px', 
            background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 700,
            border: '1px solid rgba(99, 102, 241, 0.25)'
          }}>
            {monthEventsCount} Milestones
          </span>
          <button
            onClick={todayMonth}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
          >
            Today
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={prevMonth}
            className="btn btn-ghost btn-sm btn-icon"
            title="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="btn btn-ghost btn-sm btn-icon"
            title="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Main Calendar Content */}
      {viewMode === 'MONTH' ? (
        <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
          {/* Day of Week Headers */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', 
            minWidth: '760px', marginBottom: '0.6rem', textAlign: 'center' 
          }}>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} style={{ 
                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', 
                letterSpacing: '0.08em', color: 'var(--text-tertiary)', padding: '0.35rem 0' 
              }}>
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', minWidth: '760px' }}>
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div 
                key={`blank-${i}`} 
                style={{ 
                  minHeight: '115px', borderRadius: '14px', 
                  background: 'rgba(0, 0, 0, 0.15)', border: '1px solid rgba(255, 255, 255, 0.02)',
                  opacity: 0.35
                }} 
              />
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
                  style={{
                    minHeight: '115px', borderRadius: '14px', padding: '0.6rem',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    background: isToday 
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))' 
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isToday 
                      ? '1px solid rgba(99, 102, 241, 0.45)' 
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: isToday ? '0 0 20px -4px rgba(99, 102, 241, 0.25)' : 'none',
                    transition: 'border-color 0.2s ease, background 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ 
                      fontSize: '0.78rem', fontWeight: isToday ? 800 : 600, 
                      color: isToday ? '#818cf8' : 'var(--text-secondary)',
                      width: 24, height: 24, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isToday ? 'rgba(99, 102, 241, 0.25)' : 'transparent'
                    }}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span style={{ 
                        fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontWeight: 700 
                      }}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events Chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
                    {dayEvents.slice(0, 2).map((ev, evIdx) => {
                      const isExpiry = ev.type === 'EXPIRY';
                      return (
                        <div
                          key={evIdx}
                          onClick={() => navigate(`/contracts/${ev.id}`)}
                          style={{
                            padding: '0.25rem 0.45rem', borderRadius: '7px', fontSize: '0.68rem',
                            fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            background: isExpiry ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isExpiry ? '#fca5a5' : '#fcd34d',
                            border: `1px solid ${isExpiry ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            transition: 'transform 0.15s ease'
                          }}
                          title={ev.title}
                        >
                          {isExpiry ? '🔴 Expire: ' : '⏱ Review: '}
                          {ev.contract.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, paddingLeft: '0.2rem' }}>
                        +{dayEvents.length - 2} more...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda List View */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Chronological Contract Milestone Schedule
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {events.length} total milestones tracked
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {events.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No milestones scheduled.
              </div>
            ) : (
              events
                .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
                .map((ev, idx) => {
                  const isExpiry = ev.type === 'EXPIRY';
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(`/contracts/${ev.id}`)}
                      style={{
                        padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer', transition: 'background 0.15s ease'
                      }}
                      className="hover:bg-white/[0.03]"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isExpiry ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isExpiry ? '#f87171' : '#fbbf24',
                          border: `1px solid ${isExpiry ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                          flexShrink: 0
                        }}>
                          {isExpiry ? <AlertTriangle size={18} /> : <Clock size={18} />}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                              {ev.contract.title}
                            </span>
                            <StatusBadge status={ev.contract.status} />
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {ev.contract.contractNumber} • {ev.contract.vendorName}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                            {formatDate(ev.dateStr)}
                          </div>
                          <div style={{ 
                            fontSize: '0.72rem', fontWeight: 700,
                            color: isExpiry ? '#f87171' : '#fbbf24'
                          }}>
                            {isExpiry ? 'Contract Expiration' : 'Renewal Notice Window'}
                          </div>
                        </div>
                        <ExternalLink size={16} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
