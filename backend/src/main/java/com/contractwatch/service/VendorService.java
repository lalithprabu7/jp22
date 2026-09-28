package com.contractwatch.service;

import com.contractwatch.dto.VendorRequest;
import com.contractwatch.dto.VendorResponse;
import com.contractwatch.entity.Vendor;
import com.contractwatch.exception.ResourceNotFoundException;
import com.contractwatch.mapper.VendorMapper;
import com.contractwatch.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VendorService {

    private final VendorRepository vendorRepository;
    private final VendorMapper vendorMapper;

    public VendorResponse createVendor(VendorRequest request) {
        log.info("Creating vendor: {}", request.name());
        Vendor vendor = vendorMapper.toEntity(request);
        Vendor saved = vendorRepository.save(vendor);
        return vendorMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<VendorResponse> getAllVendors() {
        return vendorRepository.findAll().stream()
                .map(vendorMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VendorResponse getVendorById(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", id));
        return vendorMapper.toResponse(vendor);
    }

    public VendorResponse updateVendor(Long id, VendorRequest request) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", id));
        vendorMapper.updateEntity(vendor, request);
        return vendorMapper.toResponse(vendorRepository.save(vendor));
    }

    public void deleteVendor(Long id) {
        if (!vendorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vendor", id);
        }
        vendorRepository.deleteById(id);
        log.info("Deleted vendor with ID: {}", id);
    }

    @Transactional(readOnly = true)
    public Vendor getVendorEntityById(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", id));
    }
}
