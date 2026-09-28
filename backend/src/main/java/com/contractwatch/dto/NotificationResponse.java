package com.contractwatch.dto;

import com.contractwatch.entity.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
    Long id,
    Long contractId,
    String contractTitle,
    String contractNumber,
    NotificationType type,
    String message,
    LocalDateTime createdAt,
    Boolean read
) {}
