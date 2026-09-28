package com.contractwatch.dto;

import com.contractwatch.entity.ContractStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ContractResponse(
    Long id,
    String contractNumber,
    String title,
    String description,
    Long vendorId,
    String vendorName,
    String vendorEmail,
    LocalDate startDate,
    LocalDate endDate,
    Integer renewalNoticeDays,
    LocalDate renewalReviewDate,
    ContractStatus status,
    BigDecimal contractValue,
    String currency,
    String paymentFrequency,
    String documentReference,
    String documentName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    long daysUntilExpiry,
    long daysUntilRenewalReview,
    int riskScore,
    String riskLevel,
    List<String> riskReasons,
    int documentCount
) {}
