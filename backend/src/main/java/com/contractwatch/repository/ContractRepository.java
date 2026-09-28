package com.contractwatch.repository;

import com.contractwatch.entity.Contract;
import com.contractwatch.entity.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    Optional<Contract> findByContractNumber(String contractNumber);

    boolean existsByContractNumber(String contractNumber);

    List<Contract> findByStatus(ContractStatus status);

    List<Contract> findByVendorId(Long vendorId);

    /**
     * Find contracts expiring within a given date range.
     * Excludes TERMINATED contracts.
     */
    @Query("SELECT c FROM Contract c WHERE c.endDate BETWEEN :start AND :end " +
           "AND c.status != com.contractwatch.entity.ContractStatus.TERMINATED ORDER BY c.endDate ASC")
    List<Contract> findExpiringBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    /**
     * Find contracts whose renewal review date has been reached and are still active/renewal_due.
     */
    @Query("SELECT c FROM Contract c WHERE c.renewalReviewDate <= :today " +
           "AND c.endDate >= :today " +
           "AND c.status IN (com.contractwatch.entity.ContractStatus.ACTIVE, com.contractwatch.entity.ContractStatus.RENEWAL_DUE)")
    List<Contract> findContractsEnteringRenewalWindow(@Param("today") LocalDate today);

    /**
     * Find all active contracts (not terminated, not expired).
     */
    @Query("SELECT c FROM Contract c WHERE c.status IN (com.contractwatch.entity.ContractStatus.ACTIVE, com.contractwatch.entity.ContractStatus.RENEWAL_DUE, com.contractwatch.entity.ContractStatus.RENEWED)")
    List<Contract> findActiveContracts();

    /**
     * Find contracts that have passed their end date but are still active.
     */
    @Query("SELECT c FROM Contract c WHERE c.endDate < :today " +
           "AND c.status IN (com.contractwatch.entity.ContractStatus.ACTIVE, com.contractwatch.entity.ContractStatus.RENEWAL_DUE)")
    List<Contract> findExpiredButNotMarked(@Param("today") LocalDate today);

    /**
     * Count contracts by status.
     */
    long countByStatus(ContractStatus status);

    /**
     * Find contracts for a specific vendor that are active.
     */
    @Query("SELECT c FROM Contract c WHERE c.vendor.id = :vendorId " +
           "AND c.status NOT IN (com.contractwatch.entity.ContractStatus.TERMINATED, com.contractwatch.entity.ContractStatus.EXPIRED)")
    List<Contract> findActiveContractsByVendorId(@Param("vendorId") Long vendorId);

    @Query("SELECT c FROM Contract c WHERE LOWER(c.contractNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.vendor.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Contract> searchContracts(@Param("query") String query);
}
