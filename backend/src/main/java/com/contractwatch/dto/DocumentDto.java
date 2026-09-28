package com.contractwatch.dto;

import com.contractwatch.entity.DocumentType;
import java.time.LocalDateTime;

public record DocumentDto(
    Long id,
    Long contractId,
    String contractName,
    String contractNumber,
    String name,
    DocumentType type,
    String version,
    String reference,
    String uploadedBy,
    LocalDateTime uploadedAt,
    String description
) {}
