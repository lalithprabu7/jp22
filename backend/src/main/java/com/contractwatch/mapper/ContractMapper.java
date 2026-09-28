package com.contractwatch.mapper;

import com.contractwatch.dto.ContractResponse;
import com.contractwatch.dto.RiskScoreResponse;
import com.contractwatch.entity.Contract;
import com.contractwatch.service.RiskScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class ContractMapper {

    private final RiskScoreService riskScoreService;

    public ContractResponse toResponse(Contract contract) {
        LocalDate today = LocalDate.now();
        long daysUntilExpiry = ChronoUnit.DAYS.between(today, contract.getEndDate());
        long daysUntilRenewal = contract.getRenewalReviewDate() != null
                ? ChronoUnit.DAYS.between(today, contract.getRenewalReviewDate())
                : -1;

        RiskScoreResponse risk = riskScoreService.calculateRisk(contract);
        int docCount = contract.getDocuments() != null ? contract.getDocuments().size() : 0;
        if (docCount == 0 && contract.getDocumentReference() != null && !contract.getDocumentReference().isBlank()) {
            docCount = 1;
        }

        return new ContractResponse(
                contract.getId(),
                contract.getContractNumber(),
                contract.getTitle(),
                contract.getDescription(),
                contract.getVendor() != null ? contract.getVendor().getId() : null,
                contract.getVendor() != null ? contract.getVendor().getName() : "Unknown",
                contract.getVendor() != null ? contract.getVendor().getEmail() : "",
                contract.getStartDate(),
                contract.getEndDate(),
                contract.getRenewalNoticeDays(),
                contract.getRenewalReviewDate(),
                contract.getStatus(),
                contract.getContractValue() != null ? contract.getContractValue() : BigDecimal.ZERO,
                contract.getCurrency() != null ? contract.getCurrency() : "INR",
                contract.getPaymentFrequency() != null ? contract.getPaymentFrequency() : "ANNUALLY",
                contract.getDocumentReference(),
                contract.getDocumentName(),
                contract.getCreatedAt(),
                contract.getUpdatedAt(),
                daysUntilExpiry,
                daysUntilRenewal,
                risk.riskScore(),
                risk.riskLevel(),
                risk.riskReasons(),
                docCount
        );
    }
}
