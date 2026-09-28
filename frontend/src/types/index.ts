export interface Vendor {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  companyAddress?: string;
  createdAt: string;
  totalContracts: number;
  activeContracts: number;
}

export interface Contract {
  id: number;
  contractNumber: string;
  title: string;
  description?: string;
  vendorId: number;
  vendorName: string;
  vendorEmail?: string;
  startDate: string;
  endDate: string;
  renewalNoticeDays: number;
  renewalReviewDate: string;
  status: ContractStatus;
  documentReference?: string;
  documentName?: string;
  createdAt: string;
  updatedAt: string;
  daysUntilExpiry: number;
  daysUntilRenewalReview: number;
}

export type ContractStatus = 
  | 'ACTIVE' 
  | 'RENEWAL_DUE' 
  | 'RENEWED' 
  | 'TERMINATED' 
  | 'EXPIRED';

export interface RenewalDecision {
  id: number;
  contractId: number;
  contractTitle: string;
  contractNumber: string;
  decision: 'RENEWED' | 'TERMINATED';
  decisionDate: string;
  newEndDate?: string;
  remarks?: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  contractId?: number;
  contractTitle?: string;
  contractNumber?: string;
  type: 'RENEWAL_DUE' | 'EXPIRING_SOON' | 'CONTRACT_EXPIRED' | 'STATUS_CHANGED';
  message: string;
  createdAt: string;
  read: boolean;
}

export interface DashboardSummary {
  totalContracts: number;
  activeContracts: number;
  renewalDue: number;
  expiringWithin30Days: number;
  expiredContracts: number;
  terminatedContracts: number;
  renewedContracts: number;
  unreadNotifications: number;
}

export interface CopilotInsight {
  severity: 'HIGH_RISK' | 'WARNING' | 'HEALTHY';
  title: string;
  description: string;
}

export interface CopilotResponse {
  message: string;
  intent: string;
  data: (Contract | Vendor)[];
  insight?: CopilotInsight;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
