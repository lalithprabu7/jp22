package com.contractwatch.dto;

import java.time.LocalDateTime;

public record VendorResponse(
    Long id,
    String name,
    String contactPerson,
    String email,
    String phone,
    String companyAddress,
    LocalDateTime createdAt,
    int totalContracts,
    int activeContracts
) {}
