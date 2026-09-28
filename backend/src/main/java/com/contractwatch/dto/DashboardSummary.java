package com.contractwatch.dto;

public record DashboardSummary(
    long totalContracts,
    long activeContracts,
    long renewalDue,
    long expiringWithin30Days,
    long expiredContracts,
    long terminatedContracts,
    long renewedContracts,
    long unreadNotifications
) {}
