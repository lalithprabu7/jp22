package com.contractwatch.dto;

import java.util.List;

public record CopilotResponse(
    String message,
    String intent,
    List<?> data,
    InsightCard insight
) {
    public record InsightCard(
        String severity,  // HIGH_RISK, WARNING, HEALTHY
        String title,
        String description
    ) {}
}
