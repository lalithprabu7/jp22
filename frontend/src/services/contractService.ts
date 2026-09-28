import api from './api';
import type {
  Contract, Vendor, Notification, DashboardSummary, RenewalDecision, CopilotResponse,
  DocumentDto, CreateDocumentRequest, AuditEventDto, GlobalSearchResponse,
  StatusDistribution, MonthlyExpiry, VendorShare, RiskDistribution, PortfolioMetrics
} from '../types';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const getDashboardSummary = () =>
  api.get<DashboardSummary>('/dashboard/summary').then(r => r.data);

// ─── VENDORS ──────────────────────────────────────────────────────────────────
export const getVendors = () =>
  api.get<Vendor[]>('/vendors').then(r => r.data);

export const getVendor = (id: number) =>
  api.get<Vendor>(`/vendors/${id}`).then(r => r.data);

export const createVendor = (data: Partial<Vendor>) =>
  api.post<Vendor>('/vendors', data).then(r => r.data);

export const updateVendor = (id: number, data: Partial<Vendor>) =>
  api.put<Vendor>(`/vendors/${id}`, data).then(r => r.data);

export const deleteVendor = (id: number) =>
  api.delete(`/vendors/${id}`);

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
export const getContracts = () =>
  api.get<Contract[]>('/contracts').then(r => r.data);

export const getContract = (id: number) =>
  api.get<Contract>(`/contracts/${id}`).then(r => r.data);

export const createContract = (data: Record<string, unknown>) =>
  api.post<Contract>('/contracts', data).then(r => r.data);

export const updateContract = (id: number, data: Record<string, unknown>) =>
  api.put<Contract>(`/contracts/${id}`, data).then(r => r.data);

export const deleteContract = (id: number) =>
  api.delete(`/contracts/${id}`);

export const getExpiringContracts = (days = 30) =>
  api.get<Contract[]>(`/contracts/expiring?days=${days}`).then(r => r.data);

export const getRenewalDueContracts = () =>
  api.get<Contract[]>('/contracts/renewal-due').then(r => r.data);

export const getActiveContracts = () =>
  api.get<Contract[]>('/contracts/active').then(r => r.data);

export const getTerminatedContracts = () =>
  api.get<Contract[]>('/contracts/terminated').then(r => r.data);

export const getExpiredContracts = () =>
  api.get<Contract[]>('/contracts/expired').then(r => r.data);

export const renewContract = (id: number, data: { newEndDate: string; newContractValue?: number; remarks?: string }) =>
  api.post<Contract>(`/contracts/${id}/renew`, data).then(r => r.data);

export const terminateContract = (id: number, data: { remarks?: string }) =>
  api.post<Contract>(`/contracts/${id}/terminate`, data).then(r => r.data);

export const getContractDecisions = (id: number) =>
  api.get<RenewalDecision[]>(`/contracts/${id}/decisions`).then(r => r.data);

export const addDocumentReference = (id: number, data: { documentName?: string; documentReference?: string }) =>
  api.post<Contract>(`/contracts/${id}/document-reference`, data).then(r => r.data);

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
export const getAllDocuments = () =>
  api.get<DocumentDto[]>('/documents').then(r => r.data);

export const getContractDocuments = (contractId: number) =>
  api.get<DocumentDto[]>(`/contracts/${contractId}/documents`).then(r => r.data);

export const addContractDocument = (contractId: number, data: CreateDocumentRequest) =>
  api.post<DocumentDto>(`/contracts/${contractId}/documents`, data).then(r => r.data);

export const deleteDocument = (documentId: number) =>
  api.delete(`/documents/${documentId}`);

// ─── AUDIT TIMELINE ───────────────────────────────────────────────────────────
export const getContractAuditTimeline = (contractId: number) =>
  api.get<AuditEventDto[]>(`/contracts/${contractId}/audit`).then(r => r.data);

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
export const globalSearch = (query: string) =>
  api.get<GlobalSearchResponse>(`/search?q=${encodeURIComponent(query)}`).then(r => r.data);

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
export const getAnalyticsStatus = () =>
  api.get<StatusDistribution[]>('/analytics/status').then(r => r.data);

export const getAnalyticsExpiry = () =>
  api.get<MonthlyExpiry[]>('/analytics/expiry').then(r => r.data);

export const getAnalyticsVendors = () =>
  api.get<VendorShare[]>('/analytics/vendors').then(r => r.data);

export const getAnalyticsRisk = () =>
  api.get<RiskDistribution[]>('/analytics/risk').then(r => r.data);

export const getAnalyticsMetrics = () =>
  api.get<PortfolioMetrics>('/analytics/metrics').then(r => r.data);

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export const getExportContractsUrl = () => '/api/export/contracts';
export const getExportRenewalsUrl = () => '/api/export/renewals';
export const getExportRisksUrl = () => '/api/export/risks';

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const getNotifications = () =>
  api.get<Notification[]>('/notifications').then(r => r.data);

export const markNotificationRead = (id: number) =>
  api.put<Notification>(`/notifications/${id}/read`).then(r => r.data);

export const markAllNotificationsRead = () =>
  api.put('/notifications/read-all');

// ─── COPILOT ──────────────────────────────────────────────────────────────────
export const copilotChat = (message: string) =>
  api.post<CopilotResponse>('/copilot/chat', { message }).then(r => r.data);
