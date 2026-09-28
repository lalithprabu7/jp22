package com.contractwatch.service;

import com.contractwatch.dto.ContractResponse;
import com.contractwatch.dto.DocumentDto;
import com.contractwatch.dto.GlobalSearchResponse;
import com.contractwatch.dto.VendorResponse;
import com.contractwatch.mapper.ContractMapper;
import com.contractwatch.mapper.DocumentMapper;
import com.contractwatch.mapper.VendorMapper;
import com.contractwatch.repository.ContractRepository;
import com.contractwatch.repository.DocumentRepository;
import com.contractwatch.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GlobalSearchService {

    private final ContractRepository contractRepository;
    private final VendorRepository vendorRepository;
    private final DocumentRepository documentRepository;
    private final ContractMapper contractMapper;
    private final VendorMapper vendorMapper;
    private final DocumentMapper documentMapper;

    public GlobalSearchResponse search(String query) {
        if (query == null || query.trim().length() < 2) {
            return new GlobalSearchResponse(List.of(), List.of(), List.of());
        }

        String q = query.trim();

        List<ContractResponse> contracts = contractRepository.searchContracts(q).stream()
                .map(contractMapper::toResponse)
                .limit(8)
                .toList();

        List<VendorResponse> vendors = vendorRepository.findByNameContainingIgnoreCaseOrContactPersonContainingIgnoreCase(q, q).stream()
                .map(vendorMapper::toResponse)
                .limit(5)
                .toList();

        List<DocumentDto> documents = documentRepository.findByNameContainingIgnoreCase(q).stream()
                .map(documentMapper::toDto)
                .limit(5)
                .toList();

        return new GlobalSearchResponse(contracts, vendors, documents);
    }
}
