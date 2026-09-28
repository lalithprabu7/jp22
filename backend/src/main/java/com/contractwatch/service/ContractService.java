package com.contractwatch.service;

import com.contractwatch.dto.*;
import com.contractwatch.entity.*;
import com.contractwatch.exception.BusinessRuleException;
import com.contractwatch.exception.DuplicateResourceException;
import com.contractwatch.exception.ResourceNotFoundException;
import com.contractwatch.mapper.ContractMapper;
import com.contractwatch.mapper.RenewalDecisionMapper;
import com.contractwatch.repository.ContractRepository;
import com.contractwatch.repository.RenewalDecisionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Core business service for contract management.
 *
 * BUSINESS RULES ENFORCED HERE:
 * Rule 1: renewalReviewDate = endDate - renewalNoticeDays
 * Rule 2: Terminated/Expired contracts MUST NOT appear in active renewal reminders.
 * Rule 3: newEndDate for renewal MUST be after the current endDate.
 * Rule 4: Cannot renew a terminated or expired contract.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ContractService {

    private final ContractRepository contractRepository;
    private final RenewalDecisionRepository renewalDecisionRepository;
    private final VendorService vendorService;
    private final ContractMapper contractMapper;
    private final RenewalDecisionMapper renewalDecisionMapper;
    private final NotificationService notificationService;

    // ─── CREATE ─────────────────────────────────────────────────────────────────

    public ContractResponse createContract(CreateContractRequest request) {
        log.info("Creating contract: {}", request.contractNumber());

        // Business Rule: Contract number must be unique
        if (contractRepository.existsByContractNumber(request.contractNumber())) {
            throw new DuplicateResourceException(
                "Contract number '" + request.contractNumber() + "' already exists."
            );
        }

        // Business Rule: Vendor must exist
        Vendor vendor = vendorService.getVendorEntityById(request.vendorId());

        // Business Rule: endDate > startDate
        if (!request.endDate().isAfter(request.startDate())) {
            throw new BusinessRuleException("End date must be after start date.");
        }

        // Business Rule: renewalNoticeDays must not exceed contract duration
        long contractDuration = ChronoUnit.DAYS.between(request.startDate(), request.endDate());
        if (request.renewalNoticeDays() >= contractDuration) {
            throw new BusinessRuleException(
                "Renewal notice period (" + request.renewalNoticeDays() + " days) must not exceed " +
                "the total contract duration (" + contractDuration + " days)."
            );
        }

        // Business Rule: Calculate renewalReviewDate = endDate - renewalNoticeDays
        LocalDate renewalReviewDate = request.endDate().minusDays(request.renewalNoticeDays());

        // Determine initial status
        ContractStatus status = determineStatus(
            request.startDate(), request.endDate(), renewalReviewDate, null
        );

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
                .documentReference(request.documentReference())
                .documentName(request.documentName())
                .build();

        Contract saved = contractRepository.save(contract);
        log.info("Contract created with ID: {}, Status: {}", saved.getId(), saved.getStatus());

        if (status == ContractStatus.RENEWAL_DUE) {
            notificationService.createNotification(
                saved, NotificationType.RENEWAL_DUE,
                "Contract '" + saved.getTitle() + "' has entered the renewal window."
            );
        }

        return contractMapper.toResponse(saved);
    }

    // ─── READ ────────────────────────────────────────────────────────────────────

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
    public List<ContractResponse> getExpiringContracts(int days) {
        LocalDate today = LocalDate.now();
        LocalDate future = today.plusDays(days);
        return contractRepository.findExpiringBetween(today, future).stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getRenewalDueContracts() {
        // Business Rule: Only return contracts with status RENEWAL_DUE (excludes TERMINATED)
        return contractRepository.findByStatus(ContractStatus.RENEWAL_DUE).stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getActiveContracts() {
        return contractRepository.findActiveContracts().stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getContractsByStatus(ContractStatus status) {
        return contractRepository.findByStatus(status).stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    // ─── UPDATE ──────────────────────────────────────────────────────────────────

    public ContractResponse updateContract(Long id, UpdateContractRequest request) {
        Contract contract = findContractById(id);

        if (request.title() != null) contract.setTitle(request.title());
        if (request.description() != null) contract.setDescription(request.description());
        if (request.documentReference() != null) contract.setDocumentReference(request.documentReference());
        if (request.documentName() != null) contract.setDocumentName(request.documentName());

        // If dates or notice period are being changed, revalidate
        LocalDate startDate = request.startDate() != null ? request.startDate() : contract.getStartDate();
        LocalDate endDate = request.endDate() != null ? request.endDate() : contract.getEndDate();
        Integer noticeDays = request.renewalNoticeDays() != null ? request.renewalNoticeDays() : contract.getRenewalNoticeDays();

        if (request.vendorId() != null) {
            Vendor vendor = vendorService.getVendorEntityById(request.vendorId());
            contract.setVendor(vendor);
        }

        if (request.startDate() != null || request.endDate() != null || request.renewalNoticeDays() != null) {
            if (!endDate.isAfter(startDate)) {
                throw new BusinessRuleException("End date must be after start date.");
            }
            long duration = startDate.until(endDate).getDays();
            if (noticeDays >= duration) {
                throw new BusinessRuleException(
                    "Renewal notice period must not exceed contract duration."
                );
            }
            contract.setStartDate(startDate);
            contract.setEndDate(endDate);
            contract.setRenewalNoticeDays(noticeDays);
            contract.setRenewalReviewDate(endDate.minusDays(noticeDays));

            // Re-determine status only if not TERMINATED/RENEWED
            if (contract.getStatus() != ContractStatus.TERMINATED &&
                contract.getStatus() != ContractStatus.RENEWED) {
                contract.setStatus(determineStatus(
                    startDate, endDate, contract.getRenewalReviewDate(), contract.getStatus()
                ));
            }
        }

        return contractMapper.toResponse(contractRepository.save(contract));
    }

    // ─── DELETE ──────────────────────────────────────────────────────────────────

    public void deleteContract(Long id) {
        if (!contractRepository.existsById(id)) {
            throw new ResourceNotFoundException("Contract", id);
        }
        contractRepository.deleteById(id);
        log.info("Deleted contract with ID: {}", id);
    }

    // ─── RENEWAL / TERMINATION ───────────────────────────────────────────────────

    public ContractResponse renewContract(Long id, RenewalRequest request) {
        Contract contract = findContractById(id);

        // Business Rule: Cannot renew a terminated contract
        if (contract.getStatus() == ContractStatus.TERMINATED) {
            throw new BusinessRuleException("A terminated contract cannot be renewed.");
        }

        // Business Rule: Cannot renew an expired contract without explicit support
        if (contract.getStatus() == ContractStatus.EXPIRED) {
            throw new BusinessRuleException(
                "An expired contract cannot be renewed. Please create a new contract instead."
            );
        }

        // Business Rule: newEndDate must be after current endDate
        if (!request.newEndDate().isAfter(contract.getEndDate())) {
            throw new BusinessRuleException(
                "New renewal end date must be after the current contract end date (" +
                contract.getEndDate() + ")."
            );
        }

        // Create renewal decision log
        RenewalDecision decision = RenewalDecision.builder()
                .contract(contract)
                .decision(RenewalDecisionType.RENEWED)
                .decisionDate(LocalDate.now())
                .newEndDate(request.newEndDate())
                .remarks(request.remarks())
                .build();
        renewalDecisionRepository.save(decision);

        // Update contract
        contract.setEndDate(request.newEndDate());
        contract.setRenewalReviewDate(request.newEndDate().minusDays(contract.getRenewalNoticeDays()));
        contract.setStatus(ContractStatus.RENEWED);

        Contract saved = contractRepository.save(contract);
        log.info("Contract {} renewed. New end date: {}", id, request.newEndDate());

        notificationService.createNotification(
            saved, NotificationType.STATUS_CHANGED,
            "Contract '" + saved.getTitle() + "' has been renewed. New expiry: " + request.newEndDate()
        );

        return contractMapper.toResponse(saved);
    }

    public ContractResponse terminateContract(Long id, TerminationRequest request) {
        Contract contract = findContractById(id);

        // Business Rule: Cannot re-terminate a terminated contract
        if (contract.getStatus() == ContractStatus.TERMINATED) {
            throw new BusinessRuleException("Contract is already terminated.");
        }

        // Create termination decision log
        RenewalDecision decision = RenewalDecision.builder()
                .contract(contract)
                .decision(RenewalDecisionType.TERMINATED)
                .decisionDate(LocalDate.now())
                .remarks(request.remarks())
                .build();
        renewalDecisionRepository.save(decision);

        // Update contract status — TERMINATED contracts will NOT appear in any active reminders
        contract.setStatus(ContractStatus.TERMINATED);
        Contract saved = contractRepository.save(contract);
        log.info("Contract {} terminated.", id);

        notificationService.createNotification(
            saved, NotificationType.STATUS_CHANGED,
            "Contract '" + saved.getTitle() + "' has been terminated."
        );

        return contractMapper.toResponse(saved);
    }

    // ─── RENEWAL DECISIONS ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RenewalDecisionResponse> getDecisions(Long contractId) {
        findContractById(contractId); // ensure contract exists
        return renewalDecisionRepository.findByContractIdOrderByCreatedAtDesc(contractId).stream()
                .map(renewalDecisionMapper::toResponse)
                .toList();
    }

    // ─── DOCUMENT REFERENCES ─────────────────────────────────────────────────────

    public ContractResponse addDocumentReference(Long id, DocumentReferenceRequest request) {
        Contract contract = findContractById(id);
        contract.setDocumentReference(request.documentReference());
        contract.setDocumentName(request.documentName());
        return contractMapper.toResponse(contractRepository.save(contract));
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
        long expiring30 = contractRepository.findExpiringBetween(today, today.plusDays(30)).size();
        long unread = notificationService.countUnread();

        return new DashboardSummary(total, active, renewalDue, expiring30, expired, terminated, renewed, unread);
    }

    // ─── SCHEDULER SUPPORT ───────────────────────────────────────────────────────

    /**
     * Called by the scheduler to check and update contract statuses.
     * Implements Business Rule 1 and expiry detection.
     */
    public void checkAndUpdateStatuses() {
        LocalDate today = LocalDate.now();

        // Mark contracts as RENEWAL_DUE
        List<Contract> enteringRenewal = contractRepository.findContractsEnteringRenewalWindow(today);
        for (Contract contract : enteringRenewal) {
            if (contract.getStatus() == ContractStatus.ACTIVE) {
                contract.setStatus(ContractStatus.RENEWAL_DUE);
                contractRepository.save(contract);
                log.info("Contract '{}' (ID:{}) marked RENEWAL_DUE", contract.getTitle(), contract.getId());
                notificationService.createNotificationIfNotExists(
                    contract, NotificationType.RENEWAL_DUE,
                    "Renewal review due for contract '" + contract.getTitle() +
                    "'. Contract expires on " + contract.getEndDate() + "."
                );
            }
        }

        // Mark contracts as EXPIRED if past end date
        List<Contract> expired = contractRepository.findExpiredButNotMarked(today);
        for (Contract contract : expired) {
            contract.setStatus(ContractStatus.EXPIRED);
            contractRepository.save(contract);
            log.warn("Contract '{}' (ID:{}) marked EXPIRED", contract.getTitle(), contract.getId());
            notificationService.createNotificationIfNotExists(
                contract, NotificationType.CONTRACT_EXPIRED,
                "Contract '" + contract.getTitle() + "' has expired on " + contract.getEndDate() + "."
            );
        }
    }

    // ─── INTERNAL HELPERS ────────────────────────────────────────────────────────

    private Contract findContractById(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract", id));
    }

    /**
     * Determine the initial status of a contract based on current date vs dates.
     * This enforces Business Rule 1 at creation time.
     */
    private ContractStatus determineStatus(
            LocalDate startDate, LocalDate endDate,
            LocalDate renewalReviewDate, ContractStatus currentStatus) {
        LocalDate today = LocalDate.now();

        if (currentStatus == ContractStatus.TERMINATED) return ContractStatus.TERMINATED;

        if (today.isAfter(endDate)) return ContractStatus.EXPIRED;

        if (renewalReviewDate != null &&
            !today.isBefore(renewalReviewDate) &&
            !today.isAfter(endDate)) {
            return ContractStatus.RENEWAL_DUE;
        }

        return ContractStatus.ACTIVE;
    }
}
