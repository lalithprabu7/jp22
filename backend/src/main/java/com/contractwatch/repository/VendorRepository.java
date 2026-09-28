package com.contractwatch.repository;

import com.contractwatch.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Optional<Vendor> findByNameIgnoreCase(String name);
    boolean existsByEmailIgnoreCase(String email);
    List<Vendor> findByNameContainingIgnoreCaseOrContactPersonContainingIgnoreCase(String name, String contactPerson);
}
