package com.contractwatch.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateContractRequest(
    @Size(max = 300, message = "Title must not exceed 300 characters")
    String title,

    String description,

    Long vendorId,

    LocalDate startDate,

    LocalDate endDate,

    @Positive(message = "Renewal notice period must be greater than 0")
    Integer renewalNoticeDays,

    String documentReference,

    String documentName
) {}
