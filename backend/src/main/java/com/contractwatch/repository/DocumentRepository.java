package com.contractwatch.repository;

import com.contractwatch.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByContractIdOrderByUploadedAtDesc(Long contractId);
    List<Document> findByNameContainingIgnoreCase(String query);
}
