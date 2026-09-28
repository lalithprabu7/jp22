import type { ContractStatus } from '../types';
import { getStatusBadgeClassRaw } from '../utils/formatters';

interface StatusBadgeProps {
  status: ContractStatus;
}

const labels: Record<ContractStatus, string> = {
  ACTIVE: 'Active',
  RENEWAL_DUE: 'Renewal Due',
  RENEWED: 'Renewed',
  TERMINATED: 'Terminated',
  EXPIRED: 'Expired',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={getStatusBadgeClassRaw(status)}>
      {labels[status] ?? status}
    </span>
  );
}
