package com.contractwatch.dto;

import java.util.List;

public record GlobalSearchResponse(
    List<ContractResponse> contracts,
    List<VendorResponse> vendors,
    List<DocumentDto> documents
) {}
