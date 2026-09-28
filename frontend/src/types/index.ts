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

export type ContractStatus = 
  | 'ACTIVE' 
  | 'RENEWAL_DUE' 
  | 'RENEWED' 
  | 'TERMINATED' 
  | 'EXPIRED';

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
  contractValue: number;
  currency: string;
  paymentFrequency: string;
  documentReference?: string;
  documentName?: string;
  createdAt: string;
  updatedAt: string;
  daysUntilExpiry: number;
  daysUntilRenewalReview: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskReasons: string[];
  documentCount: number;
}

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
  type: 'RENEWAL_DUE' | 'EXPIRING_SOON' | 'URGENT' | 'CONTRACT_EXPIRED' | 'STATUS_CHANGED';
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
  criticalRiskContracts: number;
  totalContractValue: number;
  activeContractValue: number;
  upcomingRenewalValue: number;
}

export interface DocumentDto {
  id: number;
  contractId: number;
  contractName?: string;
  contractNumber?: string;
  name: string;
  type: 'CONTRACT' | 'INVOICE' | 'AGREEMENT' | 'AMENDMENT' | 'COMPLIANCE' | 'OTHER';
  version: string;
  reference: string;
  uploadedBy?: string;
  uploadedAt: string;
  description?: string;
}

export interface CreateDocumentRequest {
  name: string;
  type: string;
  version?: string;
  reference: string;
  uploadedBy?: string;
  description?: string;
}

export interface AuditEventDto {
  id: number;
  contractId: number;
  contractNumber?: string;
  eventType: 'CONTRACT_CREATED' | 'DOCUMENT_ADDED' | 'RENEWAL_WINDOW_STARTED' | 'RENEWAL_REVIEWED' | 'CONTRACT_RENEWED' | 'CONTRACT_TERMINATED' | 'STATUS_CHANGED';
  description: string;
  performedBy: string;
  createdAt: string;
}

export interface GlobalSearchResponse {
  contracts: Contract[];
  vendors: Vendor[];
  documents: DocumentDto[];
}

export interface StatusDistribution {
  status: string;
  count: number;
  totalValue: number;
  percentage: number;
}

export interface MonthlyExpiry {
  month: string;
  count: number;
  totalValue: number;
}

export interface VendorShare {
  vendorName: string;
  count: number;
  totalValue: number;
}

export interface RiskDistribution {
  riskLevel: string;
  count: number;
  totalValue: number;
}

export interface PortfolioMetrics {
  totalContracts: number;
  totalContractValue: number;
  activeContractValue: number;
  renewalRatePercentage: number;
  avgDurationMonths: number;
  criticalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
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
  suggestedQuestions?: string[];
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';
