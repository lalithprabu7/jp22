package com.contractwatch.dto;

import jakarta.validation.constraints.NotBlank;

public record CopilotRequest(
    @NotBlank(message = "Message cannot be empty")
    String message
) {}
