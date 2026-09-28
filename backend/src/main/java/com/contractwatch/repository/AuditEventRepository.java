package com.contractwatch.repository;

import com.contractwatch.entity.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    List<AuditEvent> findByContractIdOrderByCreatedAtDesc(Long contractId);
    List<AuditEvent> findTop20ByOrderByCreatedAtDesc();
}
