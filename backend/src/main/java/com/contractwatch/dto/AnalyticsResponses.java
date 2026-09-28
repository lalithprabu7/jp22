package com.contractwatch.dto;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsResponses {

    public record StatusDistribution(
        String status,
        long count,
        BigDecimal totalValue,
        double percentage
    ) {}

    public record MonthlyExpiry(
        String month,
        long count,
        BigDecimal totalValue
    ) {}

    public record VendorShare(
        String vendorName,
        long count,
        BigDecimal totalValue
    ) {}

    public record RiskDistribution(
        String riskLevel, // LOW, MEDIUM, HIGH, CRITICAL
        long count,
        BigDecimal totalValue
    ) {}

    public record PortfolioMetrics(
        long totalContracts,
        BigDecimal totalContractValue,
        BigDecimal activeContractValue,
        double renewalRatePercentage,
        double avgDurationMonths,
        long criticalCount,
        long highRiskCount,
        long mediumRiskCount,
        long lowRiskCount
    ) {}
}
