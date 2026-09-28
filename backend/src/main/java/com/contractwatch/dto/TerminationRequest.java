package com.contractwatch.dto;

import jakarta.validation.constraints.Size;

public record TerminationRequest(
    @Size(max = 1000, message = "Remarks must not exceed 1000 characters")
    String remarks
) {}
