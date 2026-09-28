package com.contractwatch.service;

import com.contractwatch.dto.*;
import com.contractwatch.entity.*;
import com.contractwatch.exception.BusinessRuleException;
import com.contractwatch.exception.DuplicateResourceException;
import com.contractwatch.exception.ResourceNotFoundException;
import com.contractwatch.mapper.AuditEventMapper;
import com.contractwatch.mapper.ContractMapper;
import com.contractwatch.mapper.DocumentMapper;
import com.contractwatch.mapper.RenewalDecisionMapper;
import com.contractwatch.repository.AuditEventRepository;
import com.contractwatch.repository.ContractRepository;
import com.contractwatch.repository.DocumentRepository;
import com.contractwatch.repository.RenewalDecisionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Core business service for contract management.
 * Enforces all 10 enterprise business rules, risk scoring, audit events, and document management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ContractService {

    private final ContractRepository contractRepository;
    private final RenewalDecisionRepository renewalDecisionRepository;
    private final DocumentRepository documentRepository;
    private final AuditEventRepository auditEventRepository;
    private final VendorService vendorService;
    private final ContractMapper contractMapper;
    private final RenewalDecisionMapper renewalDecisionMapper;
    private final DocumentMapper documentMapper;
    private final AuditEventMapper auditEventMapper;
    private final NotificationService notificationService;
    private final RiskScoreService riskScoreService;

    // ─── CREATE ─────────────────────────────────────────────────────────────────

    public ContractResponse createContract(CreateContractRequest request) {
        log.info("Creating contract: {}", request.contractNumber());

        // Business Rule 4: Contract number must be unique
        if (contractRepository.existsByContractNumber(request.contractNumber())) {
            throw new DuplicateResourceException(
                "Contract number '" + request.contractNumber() + "' already exists."
            );
        }

        // Business Rule: Vendor must exist
        Vendor vendor = vendorService.getVendorEntityById(request.vendorId());

        // Business Rule 1: endDate > startDate
        if (!request.endDate().isAfter(request.startDate())) {
            throw new BusinessRuleException("End date must be after start date.");
        }

        // Business Rule 3: renewalNoticeDays must not exceed contract duration
        long contractDuration = ChronoUnit.DAYS.between(request.startDate(), request.endDate());
        if (request.renewalNoticeDays() >= contractDuration) {
            throw new BusinessRuleException(
                "Renewal notice period (" + request.renewalNoticeDays() + " days) must not exceed " +
                "the total contract duration (" + contractDuration + " days)."
            );
        }

        // Business Rule 5: Calculate renewalReviewDate = endDate - renewalNoticeDays
        LocalDate renewalReviewDate = request.endDate().minusDays(request.renewalNoticeDays());

        // Determine initial status based on rules 6 and 7
        ContractStatus status = determineStatus(
            request.startDate(), request.endDate(), renewalReviewDate, null
        );

        BigDecimal value = request.contractValue() != null ? request.contractValue() : BigDecimal.ZERO;
        String currency = request.currency() != null && !request.currency().isBlank() ? request.currency() : "INR";
        String freq = request.paymentFrequency() != null && !request.paymentFrequency().isBlank() ? request.paymentFrequency() : "ANNUALLY";

        Contract contract = Contract.builder()
                .contractNumber(request.contractNumber())
                .title(request.title())
                .description(request.description())
                .vendor(vendor)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .renewalNoticeDays(request.renewalNoticeDays())
                .renewalReviewDate(renewalReviewDate)
                .status(status)
                .contractValue(value)
                .currency(currency)
                .paymentFrequency(freq)
                .documentReference(request.documentReference())
                .documentName(request.documentName())
                .build();

        Contract saved = contractRepository.save(contract);
        log.info("Contract created with ID: {}, Status: {}", saved.getId(), saved.getStatus());

        // Audit Trail: Contract Created
        recordAuditEvent(saved, AuditEventType.CONTRACT_CREATED,
                "Contract created with identifier " + saved.getContractNumber() + " for vendor " + vendor.getName(), "Admin");

        // Initial document reference auto-registration if provided
        if (request.documentReference() != null && !request.documentReference().isBlank()) {
            Document doc = Document.builder()
                    .contract(saved)
                    .name(request.documentName() != null && !request.documentName().isBlank() ? request.documentName() : "Master Agreement")
                    .type(DocumentType.CONTRACT)
                    .version("1.0")
                    .reference(request.documentReference())
                    .uploadedBy("Admin")
                    .description("Initial document reference attached during contract creation")
                    .build();
            documentRepository.save(doc);
            recordAuditEvent(saved, AuditEventType.DOCUMENT_ADDED, "Attached initial document reference", "Admin");
        }

        if (status == ContractStatus.RENEWAL_DUE) {
            notificationService.createNotification(
                saved, NotificationType.RENEWAL_DUE,
                "Contract '" + saved.getTitle() + "' has entered the renewal notice window."
            );
            recordAuditEvent(saved, AuditEventType.RENEWAL_WINDOW_STARTED,
                    "Renewal notice window entered", "System");
        }

        return contractMapper.toResponse(saved);
    }

    // ─── READ ───────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ContractResponse> getAllContracts() {
        return contractRepository.findAll().stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContractResponse getContractById(Long id) {
        Contract contract = findContractById(id);
        return contractMapper.toResponse(contract);
    }

    @Transactional(readOnly = true)
    public Contract findContractById(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract", id));
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getActiveContracts() {
        return contractRepository.findActiveContracts().stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getRenewalDueContracts() {
        return contractRepository.findByStatus(ContractStatus.RENEWAL_DUE).stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getExpiringContracts(int days) {
        LocalDate today = LocalDate.now();
        LocalDate end = today.plusDays(days);
        return contractRepository.findExpiringBetween(today, end).stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getContractsByStatus(ContractStatus status) {
        return contractRepository.findByStatus(status).stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getContractsByVendorId(Long vendorId) {
        vendorService.getVendorById(vendorId);
        return contractRepository.findByVendorId(vendorId).stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────────────

    public ContractResponse updateContract(Long id, UpdateContractRequest request) {
        Contract contract = findContractById(id);

        if (contract.getStatus() == ContractStatus.TERMINATED) {
            throw new BusinessRuleException("Terminated contracts cannot be edited.");
        }

        if (request.title() != null) contract.setTitle(request.title());
        if (request.description() != null) contract.setDescription(request.description());

        if (request.vendorId() != null) {
            Vendor vendor = vendorService.getVendorEntityById(request.vendorId());
            contract.setVendor(vendor);
        }

        LocalDate startDate = request.startDate() != null ? request.startDate() : contract.getStartDate();
        LocalDate endDate = request.endDate() != null ? request.endDate() : contract.getEndDate();
        Integer noticeDays = request.renewalNoticeDays() != null ? request.renewalNoticeDays() : contract.getRenewalNoticeDays();

        if (!endDate.isAfter(startDate)) {
            throw new BusinessRuleException("End date must be after start date.");
        }

        long duration = ChronoUnit.DAYS.between(startDate, endDate);
        if (noticeDays >= duration) {
            throw new BusinessRuleException("Renewal notice period must not exceed contract duration.");
        }

        contract.setStartDate(startDate);
        contract.setEndDate(endDate);
        contract.setRenewalNoticeDays(noticeDays);
        contract.setRenewalReviewDate(endDate.minusDays(noticeDays));

        if (request.contractValue() != null) contract.setContractValue(request.contractValue());
        if (request.currency() != null) contract.setCurrency(request.currency());
        if (request.paymentFrequency() != null) contract.setPaymentFrequency(request.paymentFrequency());
        if (request.documentReference() != null) contract.setDocumentReference(request.documentReference());
        if (request.documentName() != null) contract.setDocumentName(request.documentName());

        Contract saved = contractRepository.save(contract);
        recordAuditEvent(saved, AuditEventType.STATUS_CHANGED, "Contract updated with modified terms", "Manager");
        return contractMapper.toResponse(saved);
    }

    // ─── DELETE ─────────────────────────────────────────────────────────────────

    public void deleteContract(Long id) {
        Contract contract = findContractById(id);
        contractRepository.delete(contract);
        log.info("Contract {} deleted", id);
    }

    // ─── RENEW / TERMINATE ───────────────────────────────────────────────────────

    public ContractResponse renewContract(Long id, RenewalRequest request) {
        Contract contract = findContractById(id);

        // Business Rule 4: Cannot renew a terminated contract
        if (contract.getStatus() == ContractStatus.TERMINATED) {
            throw new BusinessRuleException("Cannot renew a terminated contract.");
        }

        // Business Rule 9: newEndDate must be strictly after the current endDate
        if (!request.newEndDate().isAfter(contract.getEndDate())) {
            throw new BusinessRuleException(
                "New end date (" + request.newEndDate() + ") must be after current end date (" +
                contract.getEndDate() + ")."
            );
        }

        RenewalDecision decision = RenewalDecision.builder()
                .contract(contract)
                .decision(RenewalDecisionType.RENEWED)
                .decisionDate(LocalDate.now())
                .newEndDate(request.newEndDate())
                .remarks(request.remarks())
                .build();
        renewalDecisionRepository.save(decision);

        LocalDate oldEndDate = contract.getEndDate();
        contract.setEndDate(request.newEndDate());
        contract.setRenewalReviewDate(request.newEndDate().minusDays(contract.getRenewalNoticeDays()));
        contract.setStatus(ContractStatus.RENEWED);

        if (request.newContractValue() != null) {
            contract.setContractValue(request.newContractValue());
        }

        Contract saved = contractRepository.save(contract);
        log.info("Contract {} renewed. Extended from {} to {}", id, oldEndDate, request.newEndDate());

        recordAuditEvent(saved, AuditEventType.CONTRACT_RENEWED,
                "Contract renewed until " + request.newEndDate() + " with notes: " + request.remarks(), "Manager");

        notificationService.createNotification(
            saved, NotificationType.STATUS_CHANGED,
            "Contract '" + saved.getTitle() + "' has been renewed until " + request.newEndDate() + "."
        );

        return contractMapper.toResponse(saved);
    }

    public ContractResponse terminateContract(Long id, TerminationRequest request) {
        Contract contract = findContractById(id);

        if (contract.getStatus() == ContractStatus.TERMINATED) {
            throw new BusinessRuleException("Contract is already terminated.");
        }

        RenewalDecision decision = RenewalDecision.builder()
                .contract(contract)
                .decision(RenewalDecisionType.TERMINATED)
                .decisionDate(LocalDate.now())
                .remarks(request.remarks())
                .build();
        renewalDecisionRepository.save(decision);

        contract.setStatus(ContractStatus.TERMINATED);
        Contract saved = contractRepository.save(contract);
        log.info("Contract {} terminated", id);

        recordAuditEvent(saved, AuditEventType.CONTRACT_TERMINATED,
                "Contract terminated. Reason: " + request.remarks(), "Manager");

        notificationService.createNotification(
            saved, NotificationType.STATUS_CHANGED,
            "Contract '" + saved.getTitle() + "' has been terminated."
        );

        return contractMapper.toResponse(saved);
    }

    // ─── DOCUMENTS ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DocumentDto> getAllDocuments() {
        return documentRepository.findAll().stream()
                .map(documentMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getDocuments(Long contractId) {
        findContractById(contractId);
        return documentRepository.findByContractIdOrderByUploadedAtDesc(contractId).stream()
                .map(documentMapper::toDto)
                .toList();
    }

    public DocumentDto addDocument(Long contractId, CreateDocumentRequest request) {
        Contract contract = findContractById(contractId);

        Document doc = Document.builder()
                .contract(contract)
                .name(request.name())
                .type(request.type() != null ? request.type() : DocumentType.CONTRACT)
                .version(request.version() != null && !request.version().isBlank() ? request.version() : "1.0")
                .reference(request.reference())
                .uploadedBy(request.uploadedBy() != null && !request.uploadedBy().isBlank() ? request.uploadedBy() : "Admin")
                .description(request.description())
                .build();

        Document saved = documentRepository.save(doc);

        // Also update primary reference on contract if empty
        if (contract.getDocumentReference() == null || contract.getDocumentReference().isBlank()) {
            contract.setDocumentReference(saved.getReference());
            contract.setDocumentName(saved.getName());
            contractRepository.save(contract);
        }

        recordAuditEvent(contract, AuditEventType.DOCUMENT_ADDED,
                "Document '" + saved.getName() + "' (v" + saved.getVersion() + ") uploaded", saved.getUploadedBy());

        return documentMapper.toDto(saved);
    }

    public void deleteDocument(Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));
        Contract contract = doc.getContract();
        documentRepository.delete(doc);
        recordAuditEvent(contract, AuditEventType.STATUS_CHANGED, "Document removed: " + doc.getName(), "Admin");
    }

    // ─── AUDIT TIMELINE ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AuditEventDto> getAuditTimeline(Long contractId) {
        findContractById(contractId);
        return auditEventRepository.findByContractIdOrderByCreatedAtDesc(contractId).stream()
                .map(auditEventMapper::toDto)
                .toList();
    }

    public void recordAuditEvent(Contract contract, AuditEventType type, String description, String performedBy) {
        AuditEvent event = AuditEvent.builder()
                .contract(contract)
                .eventType(type)
                .description(description)
                .performedBy(performedBy != null ? performedBy : "System")
                .build();
        auditEventRepository.save(event);
    }

    // ─── RENEWAL DECISIONS ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RenewalDecisionResponse> getDecisions(Long contractId) {
        findContractById(contractId);
        return renewalDecisionRepository.findByContractIdOrderByCreatedAtDesc(contractId).stream()
                .map(renewalDecisionMapper::toResponse)
                .toList();
    }

    // ─── DOCUMENT REFERENCES ─────────────────────────────────────────────────────

    public ContractResponse addDocumentReference(Long id, DocumentReferenceRequest request) {
        Contract contract = findContractById(id);
        contract.setDocumentReference(request.documentReference());
        contract.setDocumentName(request.documentName());
        Contract saved = contractRepository.save(contract);
        recordAuditEvent(saved, AuditEventType.DOCUMENT_ADDED, "Attached document reference: " + request.documentName(), "User");
        return contractMapper.toResponse(saved);
    }

    // ─── DASHBOARD ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardSummary getDashboardSummary() {
        long total = contractRepository.count();
        long active = contractRepository.countByStatus(ContractStatus.ACTIVE);
        long renewalDue = contractRepository.countByStatus(ContractStatus.RENEWAL_DUE);
        long expired = contractRepository.countByStatus(ContractStatus.EXPIRED);
        long terminated = contractRepository.countByStatus(ContractStatus.TERMINATED);
        long renewed = contractRepository.countByStatus(ContractStatus.RENEWED);

        LocalDate today = LocalDate.now();
        List<Contract> expiring30Contracts = contractRepository.findExpiringBetween(today, today.plusDays(30));
        long expiring30 = expiring30Contracts.size();
        long unread = notificationService.countUnread();

        List<Contract> allContracts = contractRepository.findAll();
        BigDecimal totalVal = allContracts.stream()
                .map(c -> c.getContractValue() != null ? c.getContractValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal activeVal = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE || c.getStatus() == ContractStatus.RENEWAL_DUE)
                .map(c -> c.getContractValue() != null ? c.getContractValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal upcomingRenewalVal = expiring30Contracts.stream()
                .map(c -> c.getContractValue() != null ? c.getContractValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long criticalCount = allContracts.stream()
                .filter(c -> c.getStatus() != ContractStatus.TERMINATED)
                .filter(c -> "CRITICAL".equals(riskScoreService.calculateRisk(c).riskLevel()))
                .count();

        return new DashboardSummary(
                total, active, renewalDue, expiring30, expired, terminated, renewed, unread,
                criticalCount, totalVal, activeVal, upcomingRenewalVal
        );
    }

    // ─── SCHEDULER & SMART REMINDER SYSTEM ───────────────────────────────────────

    public void checkAndUpdateStatuses() {
        LocalDate today = LocalDate.now();

        // 1. Transition Active to RENEWAL_DUE when entering window
        List<Contract> enteringRenewal = contractRepository.findContractsEnteringRenewalWindow(today);
        for (Contract contract : enteringRenewal) {
            if (contract.getStatus() == ContractStatus.ACTIVE) {
                contract.setStatus(ContractStatus.RENEWAL_DUE);
                contractRepository.save(contract);
                log.info("Contract '{}' marked RENEWAL_DUE", contract.getTitle());

                notificationService.createNotificationIfNotExists(
                    contract, NotificationType.RENEWAL_DUE,
                    "Renewal window started for '" + contract.getTitle() + "'. Expiration on " + contract.getEndDate() + "."
                );
                recordAuditEvent(contract, AuditEventType.RENEWAL_WINDOW_STARTED,
                        "Notice window opened. Action required before " + contract.getEndDate(), "System Scheduler");
            }
        }

        // 2. Mark passed contracts as EXPIRED
        List<Contract> expiredNotMarked = contractRepository.findExpiredButNotMarked(today);
        for (Contract contract : expiredNotMarked) {
            contract.setStatus(ContractStatus.EXPIRED);
            contractRepository.save(contract);
            log.info("Contract '{}' marked EXPIRED", contract.getTitle());

            notificationService.createNotificationIfNotExists(
                contract, NotificationType.CONTRACT_EXPIRED,
                "Contract '" + contract.getTitle() + "' expired on " + contract.getEndDate() + "."
            );
            recordAuditEvent(contract, AuditEventType.STATUS_CHANGED, "Contract reached expiration date", "System Scheduler");
        }

        // 3. Smart Reminder Levels (30, 15, 7, 1 days)
        List<Contract> activePipeline = contractRepository.findActiveContracts();
        for (Contract contract : activePipeline) {
            long days = ChronoUnit.DAYS.between(today, contract.getEndDate());
            if (days == 30) {
                notificationService.createNotificationIfNotExists(contract, NotificationType.EXPIRING_SOON,
                        "Upcoming: Contract '" + contract.getTitle() + "' expires in 30 days.");
            } else if (days == 15) {
                notificationService.createNotificationIfNotExists(contract, NotificationType.EXPIRING_SOON,
                        "Attention: Contract '" + contract.getTitle() + "' expires in 15 days.");
            } else if (days <= 7 && days > 1) {
                notificationService.createNotificationIfNotExists(contract, NotificationType.URGENT,
                        "URGENT: Contract '" + contract.getTitle() + "' expires in " + days + " days!");
            } else if (days == 1 || days == 0) {
                notificationService.createNotificationIfNotExists(contract, NotificationType.URGENT,
                        "CRITICAL: Contract '" + contract.getTitle() + "' expires " + (days == 0 ? "TODAY!" : "tomorrow!"));
            }
        }
    }

    private ContractStatus determineStatus(
        LocalDate startDate, LocalDate endDate, LocalDate renewalReviewDate, ContractStatus existing
    ) {
        if (existing == ContractStatus.TERMINATED) return ContractStatus.TERMINATED;
        LocalDate today = LocalDate.now();
        if (today.isAfter(endDate)) return ContractStatus.EXPIRED;
        if (!today.isBefore(renewalReviewDate)) return ContractStatus.RENEWAL_DUE;
        return ContractStatus.ACTIVE;
    }
}
