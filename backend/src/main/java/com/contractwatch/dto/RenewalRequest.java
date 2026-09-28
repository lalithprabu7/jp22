package com.contractwatch.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RenewalRequest(
    @NotNull(message = "New end date is required")
    @Future(message = "New end date must be in the future")
    LocalDate newEndDate,

    @Size(max = 1000, message = "Remarks must not exceed 1000 characters")
    String remarks
) {}
