import type { ContractStatus } from '../types';

export function getStatusBadgeClass(status: ContractStatus): string {
  return `badge badge-${status.toLowerCase().replace('_', '')}`;
}

export function getStatusBadgeClassRaw(status: ContractStatus): string {
  const map: Record<ContractStatus, string> = {
    ACTIVE: 'badge badge-active',
    RENEWAL_DUE: 'badge badge-renewal_due',
    RENEWED: 'badge badge-renewed',
    TERMINATED: 'badge badge-terminated',
    EXPIRED: 'badge badge-expired',
  };
  return map[status] || 'badge';
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getDaysLabel(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return 'Expires today';
  return `${days} days remaining`;
}

export function getUrgencyColor(days: number): string {
  if (days < 0) return 'var(--color-danger)';
  if (days <= 7) return 'var(--color-danger)';
  if (days <= 14) return '#f97316';
  if (days <= 30) return 'var(--color-warning)';
  return 'var(--color-success)';
}

export function getUrgencyLabel(days: number): string {
  if (days < 0) return 'Expired';
  if (days <= 7) return 'Critical';
  if (days <= 14) return 'Urgent';
  if (days <= 30) return 'Due Soon';
  return 'Upcoming';
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

export function formatCurrency(amount?: number | null, currency: string = 'INR'): string {
  if (amount == null) return '—';
  if (currency === 'INR') {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
  return `$${amount.toLocaleString('en-US')}`;
}
