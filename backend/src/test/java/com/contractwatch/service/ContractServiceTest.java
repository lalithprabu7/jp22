package com.contractwatch.service;

import com.contractwatch.dto.CreateContractRequest;
import com.contractwatch.dto.RenewalRequest;
import com.contractwatch.dto.RiskScoreResponse;
import com.contractwatch.dto.TerminationRequest;
import com.contractwatch.entity.*;
import com.contractwatch.exception.BusinessRuleException;
import com.contractwatch.exception.DuplicateResourceException;
import com.contractwatch.mapper.AuditEventMapper;
import com.contractwatch.mapper.ContractMapper;
import com.contractwatch.mapper.DocumentMapper;
import com.contractwatch.mapper.RenewalDecisionMapper;
import com.contractwatch.repository.AuditEventRepository;
import com.contractwatch.repository.ContractRepository;
import com.contractwatch.repository.DocumentRepository;
import com.contractwatch.repository.RenewalDecisionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContractService & Risk Engine — Business Logic Tests")
class ContractServiceTest {

    @Mock ContractRepository contractRepository;
    @Mock RenewalDecisionRepository renewalDecisionRepository;
    @Mock DocumentRepository documentRepository;
    @Mock AuditEventRepository auditEventRepository;
    @Mock VendorService vendorService;
    @Mock ContractMapper contractMapper;
    @Mock RenewalDecisionMapper renewalDecisionMapper;
    @Mock DocumentMapper documentMapper;
    @Mock AuditEventMapper auditEventMapper;
    @Mock NotificationService notificationService;
    @Mock RiskScoreService riskScoreService;

    @InjectMocks ContractService contractService;

    private Vendor vendor;
    private Contract activeContract;

    @BeforeEach
    void setUp() {
        vendor = Vendor.builder().id(1L).name("AWS").email("aws@test.com").build();

        activeContract = Contract.builder()
            .id(1L)
            .contractNumber("CW-TEST-001")
            .title("Test Contract")
            .vendor(vendor)
            .startDate(LocalDate.now().minusMonths(6))
            .endDate(LocalDate.now().plusMonths(6))
            .renewalNoticeDays(30)
            .renewalReviewDate(LocalDate.now().plusMonths(6).minusDays(30))
            .status(ContractStatus.ACTIVE)
            .contractValue(new BigDecimal("100000.00"))
            .currency("INR")
            .paymentFrequency("ANNUALLY")
            .build();
    }

    // ─── CREATE TESTS ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Should reject contract when endDate is not after startDate")
    void createContract_invalidDates_throwsBusinessRuleException() {
        CreateContractRequest request = new CreateContractRequest(
            "CW-TEST-002", "Bad Contract", null, 1L,
            LocalDate.now().plusDays(10),
            LocalDate.now(),  // endDate before startDate
            30, BigDecimal.ZERO, "INR", "ANNUALLY", null, null
        );

        when(contractRepository.existsByContractNumber(anyString())).thenReturn(false);
        when(vendorService.getVendorEntityById(1L)).thenReturn(vendor);

        assertThatThrownBy(() -> contractService.createContract(request))
            .isInstanceOf(BusinessRuleException.class)
            .hasMessageContaining("End date must be after start date");
    }

    @Test
    @DisplayName("Should reject contract with duplicate contract number")
    void createContract_duplicateNumber_throwsDuplicateResourceException() {
        CreateContractRequest request = new CreateContractRequest(
            "CW-TEST-001", "Duplicate", null, 1L,
            LocalDate.now(), LocalDate.now().plusMonths(6), 30,
            BigDecimal.ZERO, "INR", "ANNUALLY", null, null
        );

        when(contractRepository.existsByContractNumber("CW-TEST-001")).thenReturn(true);

        assertThatThrownBy(() -> contractService.createContract(request))
            .isInstanceOf(DuplicateResourceException.class)
            .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("Should reject contract when notice period exceeds duration")
    void createContract_noticePeriodExceedsDuration_throwsBusinessRuleException() {
        CreateContractRequest request = new CreateContractRequest(
            "CW-TEST-003", "Short Contract", null, 1L,
            LocalDate.now(), LocalDate.now().plusDays(20),  // 20 days
            30,  // 30 day notice > 20 day contract
            BigDecimal.ZERO, "INR", "ANNUALLY", null, null
        );

        when(contractRepository.existsByContractNumber(anyString())).thenReturn(false);
        when(vendorService.getVendorEntityById(1L)).thenReturn(vendor);

        assertThatThrownBy(() -> contractService.createContract(request))
            .isInstanceOf(BusinessRuleException.class)
            .hasMessageContaining("Renewal notice period");
    }

    @Test
    @DisplayName("Should correctly calculate renewalReviewDate = endDate - noticeDays")
    void createContract_calculatesRenewalReviewDate() {
        LocalDate start = LocalDate.now().minusDays(1);
        LocalDate end = LocalDate.now().plusDays(60);
        int noticeDays = 30;
        LocalDate expectedReview = end.minusDays(noticeDays);

        CreateContractRequest request = new CreateContractRequest(
            "CW-TEST-004", "Valid Contract", null, 1L,
            start, end, noticeDays,
            new BigDecimal("50000.00"), "INR", "ANNUALLY", null, null
        );

        when(contractRepository.existsByContractNumber(anyString())).thenReturn(false);
        when(vendorService.getVendorEntityById(1L)).thenReturn(vendor);
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> {
            Contract c = inv.getArgument(0);
            assertThat(c.getRenewalReviewDate()).isEqualTo(expectedReview);
            c.setId(99L);
            return c;
        });
        when(contractMapper.toResponse(any())).thenReturn(null);

        contractService.createContract(request);

        verify(contractRepository).save(argThat(c ->
            c.getRenewalReviewDate().equals(expectedReview)
        ));
        verify(auditEventRepository).save(any());
    }

    // ─── RENEWAL TESTS ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Should NOT renew a TERMINATED contract")
    void renewContract_terminated_throwsBusinessRuleException() {
        activeContract.setStatus(ContractStatus.TERMINATED);
        when(contractRepository.findById(1L)).thenReturn(Optional.of(activeContract));

        RenewalRequest request = new RenewalRequest(LocalDate.now().plusYears(1), null, "Renewing");

        assertThatThrownBy(() -> contractService.renewContract(1L, request))
            .isInstanceOf(BusinessRuleException.class)
            .hasMessageContaining("Cannot renew a terminated contract");
    }

    @Test
    @DisplayName("Should NOT renew a contract with newEndDate <= current endDate")
    void renewContract_newEndDateNotAfterCurrent_throwsBusinessRuleException() {
        when(contractRepository.findById(1L)).thenReturn(Optional.of(activeContract));

        // Attempt to renew with newEndDate equal to current endDate
        RenewalRequest request = new RenewalRequest(activeContract.getEndDate(), null, "Invalid renewal");

        assertThatThrownBy(() -> contractService.renewContract(1L, request))
            .isInstanceOf(BusinessRuleException.class)
            .hasMessageContaining("must be after current end date");
    }

    @Test
    @DisplayName("Should renew contract with valid newEndDate, recalculate review date, and record audit")
    void renewContract_validNewEndDate_success() {
        LocalDate newEnd = activeContract.getEndDate().plusYears(1);
        RenewalRequest request = new RenewalRequest(newEnd, new BigDecimal("120000.00"), "Annual renewal approved");

        when(contractRepository.findById(1L)).thenReturn(Optional.of(activeContract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));
        when(contractMapper.toResponse(any())).thenReturn(null);

        contractService.renewContract(1L, request);

        assertThat(activeContract.getStatus()).isEqualTo(ContractStatus.RENEWED);
        assertThat(activeContract.getEndDate()).isEqualTo(newEnd);
        assertThat(activeContract.getRenewalReviewDate()).isEqualTo(newEnd.minusDays(30));
        assertThat(activeContract.getContractValue()).isEqualTo(new BigDecimal("120000.00"));

        verify(renewalDecisionRepository).save(any(RenewalDecision.class));
        verify(auditEventRepository).save(any(AuditEvent.class));
    }

    // ─── TERMINATION TESTS ─────────────────────────────────────────────────────

    @Test
    @DisplayName("Should terminate contract and update status to TERMINATED")
    void terminateContract_setsStatusTerminated() {
        when(contractRepository.findById(1L)).thenReturn(Optional.of(activeContract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));
        when(contractMapper.toResponse(any())).thenReturn(null);

        contractService.terminateContract(1L, new TerminationRequest("Vendor contract cancelled"));

        assertThat(activeContract.getStatus()).isEqualTo(ContractStatus.TERMINATED);
        verify(renewalDecisionRepository).save(any(RenewalDecision.class));
        verify(auditEventRepository).save(any(AuditEvent.class));
    }

    // ─── RISK SCORE ENGINE TEST ────────────────────────────────────────────────

    @Test
    @DisplayName("RiskScoreService should calculate CRITICAL risk for contract expiring in 3 days with missing docs")
    void riskScoreService_criticalRisk() {
        RiskScoreService riskService = new RiskScoreService();
        Contract highRiskContract = Contract.builder()
                .title("Urgent Lapsed Contract")
                .status(ContractStatus.RENEWAL_DUE)
                .startDate(LocalDate.now().minusMonths(6))
                .endDate(LocalDate.now().plusDays(3)) // 3 days remaining (+45)
                .renewalNoticeDays(30)
                .renewalReviewDate(LocalDate.now().minusDays(10)) // review date passed (+25 status)
                .contractValue(new BigDecimal("1000000.00")) // high value (+15)
                .currency("INR")
                .vendor(vendor)
                .build(); // no documents (+15)

        RiskScoreResponse risk = riskService.calculateRisk(highRiskContract);

        assertThat(risk.riskLevel()).isEqualTo("CRITICAL");
        assertThat(risk.riskScore()).isGreaterThanOrEqualTo(81);
        assertThat(risk.riskReasons()).isNotEmpty();
    }
}
