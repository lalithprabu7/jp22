package com.contractwatch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VendorRequest(
    @NotBlank(message = "Vendor name is required")
    @Size(max = 200, message = "Vendor name must not exceed 200 characters")
    String name,

    @Size(max = 200, message = "Contact person name must not exceed 200 characters")
    String contactPerson,

    @Email(message = "Please provide a valid email address")
    @Size(max = 200)
    String email,

    @Size(max = 50, message = "Phone must not exceed 50 characters")
    String phone,

    @Size(max = 500, message = "Address must not exceed 500 characters")
    String companyAddress
) {}
