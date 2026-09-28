package com.contractwatch.service;

import com.contractwatch.dto.RiskScoreResponse;
import com.contractwatch.entity.Contract;
import com.contractwatch.entity.ContractStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class RiskScoreService {

    public RiskScoreResponse calculateRisk(Contract contract) {
        // Terminated contracts pose 0 active operational risk
        if (contract.getStatus() == ContractStatus.TERMINATED) {
            return new RiskScoreResponse(0, "LOW", List.of("Contract is terminated and inactive"));
        }

        LocalDate today = LocalDate.now();
        long daysUntilExpiry = ChronoUnit.DAYS.between(today, contract.getEndDate());
        int score = 0;
        List<String> reasons = new ArrayList<>();

        // 1. Expiry Status Factor
        if (contract.getStatus() == ContractStatus.EXPIRED || daysUntilExpiry < 0) {
            score += 50;
            reasons.add("Contract has lapsed beyond its end date without renewal (" + Math.abs(daysUntilExpiry) + " days ago)");
        } else if (daysUntilExpiry <= 5) {
            score += 45;
            reasons.add("Contract expires in " + daysUntilExpiry + " days (Immediate expiration risk)");
        } else if (daysUntilExpiry <= 15) {
            score += 30;
            reasons.add("Contract expires in " + daysUntilExpiry + " days (Action required)");
        } else if (daysUntilExpiry <= 30) {
            score += 15;
            reasons.add("Contract expires within 30 days (" + daysUntilExpiry + " days remaining)");
        }

        // 2. Renewal Review Notice Window Factor
        if (contract.getStatus() == ContractStatus.RENEWAL_DUE) {
            score += 25;
            reasons.add("Contract is currently in the active renewal review window");
        } else if (contract.getRenewalReviewDate() != null && !today.isBefore(contract.getRenewalReviewDate()) && daysUntilExpiry >= 0) {
            score += 20;
            reasons.add("Notice period review deadline has passed");
        }

        // 3. Documentation Audit Factor
        boolean hasDocs = (contract.getDocuments() != null && !contract.getDocuments().isEmpty())
                || (contract.getDocumentReference() != null && !contract.getDocumentReference().isBlank());
        if (!hasDocs) {
            score += 15;
            reasons.add("No contract documentation or master service agreement attached");
        }

        // 4. Financial Exposure / Impact Factor
        BigDecimal threshold = new BigDecimal("500000"); // 5 Lakh or 500k
        if (contract.getContractValue() != null && contract.getContractValue().compareTo(threshold) >= 0) {
            score += 15;
            reasons.add("High financial commitment (Value exceeds " + contract.getCurrency() + " " + threshold + ")");
        }

        // 5. Vendor Details Quality Factor
        if (contract.getVendor() == null || contract.getVendor().getEmail() == null || contract.getVendor().getEmail().isBlank()) {
            score += 10;
            reasons.add("Missing primary vendor contact information");
        }

        // Clamp score between 0 and 100
        score = Math.min(100, Math.max(0, score));

        // Determine Level
        String level;
        if (score <= 30) {
            level = "LOW";
        } else if (score <= 60) {
            level = "MEDIUM";
        } else if (score <= 80) {
            level = "HIGH";
        } else {
            level = "CRITICAL";
        }

        if (reasons.isEmpty()) {
            reasons.add("Contract is active and in good standing");
        }

        return new RiskScoreResponse(score, level, reasons);
    }
}
