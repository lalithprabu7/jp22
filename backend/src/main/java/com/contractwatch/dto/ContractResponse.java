package com.contractwatch.dto;

import com.contractwatch.entity.ContractStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    String documentReference,
    String documentName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    long daysUntilExpiry,
    long daysUntilRenewalReview
) {}
