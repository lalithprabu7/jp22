package com.contractwatch.mapper;

import com.contractwatch.dto.ContractResponse;
import com.contractwatch.entity.Contract;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class ContractMapper {

    public ContractResponse toResponse(Contract contract) {
        LocalDate today = LocalDate.now();
        long daysUntilExpiry = ChronoUnit.DAYS.between(today, contract.getEndDate());
        long daysUntilRenewal = contract.getRenewalReviewDate() != null
                ? ChronoUnit.DAYS.between(today, contract.getRenewalReviewDate())
                : -1;

        return new ContractResponse(
                contract.getId(),
                contract.getContractNumber(),
                contract.getTitle(),
                contract.getDescription(),
                contract.getVendor().getId(),
                contract.getVendor().getName(),
                contract.getVendor().getEmail(),
                contract.getStartDate(),
                contract.getEndDate(),
                contract.getRenewalNoticeDays(),
                contract.getRenewalReviewDate(),
                contract.getStatus(),
                contract.getDocumentReference(),
                contract.getDocumentName(),
                contract.getCreatedAt(),
                contract.getUpdatedAt(),
                daysUntilExpiry,
                daysUntilRenewal
        );
    }
}
