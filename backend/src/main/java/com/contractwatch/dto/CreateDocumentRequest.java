package com.contractwatch.dto;

import com.contractwatch.entity.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDocumentRequest(
    @NotBlank(message = "Document name is required")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    String name,

    @NotNull(message = "Document type is required")
    DocumentType type,

    String version,

    @NotBlank(message = "Document reference or URL is required")
    String reference,

    String uploadedBy,

    String description
) {}
