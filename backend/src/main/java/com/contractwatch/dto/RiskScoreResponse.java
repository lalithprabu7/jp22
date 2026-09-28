package com.contractwatch.dto;

import java.util.List;

public record RiskScoreResponse(
    int riskScore,
    String riskLevel, // LOW, MEDIUM, HIGH, CRITICAL
    List<String> riskReasons
) {}
