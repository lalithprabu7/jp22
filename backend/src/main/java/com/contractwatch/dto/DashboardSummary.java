package com.contractwatch.dto;

import java.math.BigDecimal;

public record DashboardSummary(
    long totalContracts,
    long activeContracts,
    long renewalDue,
    long expiringWithin30Days,
    long expiredContracts,
    long terminatedContracts,
    long renewedContracts,
    long unreadNotifications,
    long criticalRiskContracts,
    BigDecimal totalContractValue,
    BigDecimal activeContractValue,
    BigDecimal upcomingRenewalValue
) {}
