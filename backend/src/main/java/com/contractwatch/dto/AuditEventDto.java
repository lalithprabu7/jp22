package com.contractwatch.dto;

import com.contractwatch.entity.AuditEventType;
import java.time.LocalDateTime;

public record AuditEventDto(
    Long id,
    Long contractId,
    String contractNumber,
    AuditEventType eventType,
    String description,
    String performedBy,
    LocalDateTime createdAt
) {}
