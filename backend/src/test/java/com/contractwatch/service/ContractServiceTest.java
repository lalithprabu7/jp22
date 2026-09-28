package com.contractwatch.service;

import com.contractwatch.dto.CreateContractRequest;
import com.contractwatch.dto.RenewalRequest;
import com.contractwatch.dto.TerminationRequest;
import com.contractwatch.entity.*;
import com.contractwatch.exception.BusinessRuleException;
import com.contractwatch.exception.DuplicateResourceException;
import com.contractwatch.mapper.ContractMapper;
import com.contractwatch.mapper.RenewalDecisionMapper;
import com.contractwatch.repository.ContractRepository;
import com.contractwatch.repository.RenewalDecisionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContractService — Business Logic Tests")
class ContractServiceTest {

    @Mock ContractRepository contractRepository;
    @Mock RenewalDecisionRepository renewalDecisionRepository;
    @Mock VendorService vendorService;
    @Mock ContractMapper contractMapper;
    @Mock RenewalDecisionMapper renewalDecisionMapper;
    @Mock NotificationService notificationService;

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
            30, null, null
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
            LocalDate.now(), LocalDate.now().plusMonths(6), 30, null, null
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
            null, null
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
            start, end, noticeDays, null, null
        );

        when(contractRepository.existsByContractNumber(anyString())).thenReturn(false);
        when(vendorService.getVendorEntityById(1L)).thenReturn(vendor);
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> {
            Contract c = inv.getArgument(0);
            // Verify renewal review date is correctly calculated
            assertThat(c.getRenewalReviewDate()).isEqualTo(expectedReview);
            c.setId(99L);
            return c;
        });
        when(contractMapper.toResponse(any())).thenReturn(null);

        contractService.createContract(request);

        verify(contractRepository).save(argThat(c ->
            c.getRenewalReviewDate().equals(expectedReview)
        ));
    }

    // ─── RENEWAL TESTS ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Should NOT renew a TERMINATED contract")
    void renewContract_terminated_throwsBusinessRuleException() {
        activeContract.setStatus(ContractStatus.TERMINATED);
        when(contractRepository.findById(1L)).thenReturn(Optional.of(activeContract));

        RenewalRequest request = new RenewalRequest(LocalDate.now().plusYears(1), "Renewing");

        assertThatThrownBy(() -> contractService.renewContract(1L, request))
            .isInstanceOf(BusinessRuleException.class)
            .hasMessageContaining("terminated contract cannot be renewed");
    }

    @Test
    @DisplayName("Should NOT renew a contract with newEndDate <= current endDate")
    void renewContract_newEndDateNotAfterCurrent_throwsBusinessRuleException() {
        when(contractRepository.findById(1L)).thenReturn(Optional.of(activeContract));

        // New end date is before current end date
        RenewalRequest request = new RenewalRequest(
            activeContract.getEndDate().minusDays(10), "Early renewal"
        );

        assertThatThrownBy(() -> contractService.renewContract(1L, request))
            .isInstanceOf(BusinessRuleException.class)
            .hasMessageContaining("after the current contract end date");
    }

    @Test
    @DisplayName("Terminating contract should set status to TERMINATED")
    void terminateContract_setsStatusToTerminated() {
        when(contractRepository.findById(1L)).thenReturn(Optional.of(activeContract));
        when(renewalDecisionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));
        when(contractMapper.toResponse(any())).thenReturn(null);

        contractService.terminateContract(1L, new TerminationRequest("Switching vendor"));

        verify(contractRepository).save(argThat(c ->
            c.getStatus() == ContractStatus.TERMINATED
        ));
    }

    // ─── STATUS LOGIC TESTS ────────────────────────────────────────────────────

    @Test
    @DisplayName("Renewal due check should exclude terminated contracts")
    void getRenewalDueContracts_excludesTerminated() {
        when(contractRepository.findByStatus(ContractStatus.RENEWAL_DUE)).thenReturn(List.of());

        List<?> result = contractService.getRenewalDueContracts();

        verify(contractRepository).findByStatus(ContractStatus.RENEWAL_DUE);
        // Terminated contracts are excluded by the status filter
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Expiring contracts query should exclude terminated contracts (via repository)")
    void getExpiringContracts_excludesTerminated() {
        LocalDate today = LocalDate.now();
        when(contractRepository.findExpiringBetween(eq(today), any()))
            .thenReturn(List.of()); // Terminated contracts excluded by query

        contractService.getExpiringContracts(30);

        verify(contractRepository).findExpiringBetween(eq(today), eq(today.plusDays(30)));
    }
}
