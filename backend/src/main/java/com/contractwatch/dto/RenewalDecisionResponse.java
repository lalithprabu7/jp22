package com.contractwatch.dto;

import com.contractwatch.entity.RenewalDecisionType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RenewalDecisionResponse(
    Long id,
    Long contractId,
    String contractTitle,
    String contractNumber,
    RenewalDecisionType decision,
    LocalDate decisionDate,
    LocalDate newEndDate,
    String remarks,
    LocalDateTime createdAt
) {}
