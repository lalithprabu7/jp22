package com.contractwatch.repository;

import com.contractwatch.entity.RenewalDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RenewalDecisionRepository extends JpaRepository<RenewalDecision, Long> {
    List<RenewalDecision> findByContractIdOrderByCreatedAtDesc(Long contractId);
}
