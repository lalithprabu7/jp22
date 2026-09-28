package com.contractwatch.mapper;

import com.contractwatch.dto.VendorRequest;
import com.contractwatch.dto.VendorResponse;
import com.contractwatch.entity.Contract;
import com.contractwatch.entity.ContractStatus;
import com.contractwatch.entity.Vendor;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

@Component
public class VendorMapper {

    private static final Set<ContractStatus> ACTIVE_STATUSES = EnumSet.of(
        ContractStatus.ACTIVE, ContractStatus.RENEWAL_DUE, ContractStatus.RENEWED
    );

    public Vendor toEntity(VendorRequest request) {
        return Vendor.builder()
                .name(request.name())
                .contactPerson(request.contactPerson())
                .email(request.email())
                .phone(request.phone())
                .companyAddress(request.companyAddress())
                .build();
    }

    public VendorResponse toResponse(Vendor vendor) {
        int total = vendor.getContracts() != null ? vendor.getContracts().size() : 0;
        int active = vendor.getContracts() != null
                ? (int) vendor.getContracts().stream()
                    .filter(c -> ACTIVE_STATUSES.contains(c.getStatus()))
                    .count()
                : 0;
        return new VendorResponse(
                vendor.getId(),
                vendor.getName(),
                vendor.getContactPerson(),
                vendor.getEmail(),
                vendor.getPhone(),
                vendor.getCompanyAddress(),
                vendor.getCreatedAt(),
                total,
                active
        );
    }

    public void updateEntity(Vendor vendor, VendorRequest request) {
        if (request.name() != null) vendor.setName(request.name());
        if (request.contactPerson() != null) vendor.setContactPerson(request.contactPerson());
        if (request.email() != null) vendor.setEmail(request.email());
        if (request.phone() != null) vendor.setPhone(request.phone());
        if (request.companyAddress() != null) vendor.setCompanyAddress(request.companyAddress());
    }
}
