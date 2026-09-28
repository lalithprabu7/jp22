package com.contractwatch.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record CreateContractRequest(
    @NotBlank(message = "Contract number is required")
    @Size(max = 100, message = "Contract number must not exceed 100 characters")
    String contractNumber,

    @NotBlank(message = "Contract title is required")
    @Size(max = 300, message = "Title must not exceed 300 characters")
    String title,

    String description,

    @NotNull(message = "Vendor ID is required")
    Long vendorId,

    @NotNull(message = "Start date is required")
    LocalDate startDate,

    @NotNull(message = "End date is required")
    LocalDate endDate,

    @NotNull(message = "Renewal notice period is required")
    @Positive(message = "Renewal notice period must be greater than 0")
    Integer renewalNoticeDays,

    String documentReference,

    String documentName
) {}
