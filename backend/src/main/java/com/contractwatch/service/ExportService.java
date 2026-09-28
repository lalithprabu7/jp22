package com.contractwatch.service;

import com.contractwatch.dto.RiskScoreResponse;
import com.contractwatch.entity.Contract;
import com.contractwatch.entity.ContractStatus;
import com.contractwatch.repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExportService {

    private final ContractRepository contractRepository;
    private final RiskScoreService riskScoreService;

    public byte[] exportContractsCsv() {
        List<Contract> contracts = contractRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Contract Number,Title,Vendor,Start Date,End Date,Notice Days,Status,Value,Currency,Payment Frequency\n");

        for (Contract c : contracts) {
            sb.append(c.getId()).append(",")
              .append(escape(c.getContractNumber())).append(",")
              .append(escape(c.getTitle())).append(",")
              .append(escape(c.getVendor() != null ? c.getVendor().getName() : "")).append(",")
              .append(c.getStartDate()).append(",")
              .append(c.getEndDate()).append(",")
              .append(c.getRenewalNoticeDays()).append(",")
              .append(c.getStatus()).append(",")
              .append(c.getContractValue()).append(",")
              .append(c.getCurrency()).append(",")
              .append(c.getPaymentFrequency()).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportRenewalsCsv() {
        List<Contract> renewals = contractRepository.findByStatus(ContractStatus.RENEWAL_DUE);
        StringBuilder sb = new StringBuilder();
        sb.append("Contract Number,Title,Vendor,End Date,Review Date,Days Remaining,Value,Currency,Risk Score,Risk Level\n");

        LocalDate today = LocalDate.now();
        for (Contract c : renewals) {
            long days = ChronoUnit.DAYS.between(today, c.getEndDate());
            RiskScoreResponse risk = riskScoreService.calculateRisk(c);

            sb.append(escape(c.getContractNumber())).append(",")
              .append(escape(c.getTitle())).append(",")
              .append(escape(c.getVendor() != null ? c.getVendor().getName() : "")).append(",")
              .append(c.getEndDate()).append(",")
              .append(c.getRenewalReviewDate()).append(",")
              .append(days).append(",")
              .append(c.getContractValue()).append(",")
              .append(c.getCurrency()).append(",")
              .append(risk.riskScore()).append(",")
              .append(risk.riskLevel()).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportRiskReportCsv() {
        List<Contract> contracts = contractRepository.findAll().stream()
                .filter(c -> c.getStatus() != ContractStatus.TERMINATED)
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("Contract Number,Title,Vendor,Status,End Date,Risk Score,Risk Level,Primary Risk Reason\n");

        for (Contract c : contracts) {
            RiskScoreResponse risk = riskScoreService.calculateRisk(c);
            String primaryReason = risk.riskReasons().isEmpty() ? "N/A" : risk.riskReasons().get(0);

            sb.append(escape(c.getContractNumber())).append(",")
              .append(escape(c.getTitle())).append(",")
              .append(escape(c.getVendor() != null ? c.getVendor().getName() : "")).append(",")
              .append(c.getStatus()).append(",")
              .append(c.getEndDate()).append(",")
              .append(risk.riskScore()).append(",")
              .append(risk.riskLevel()).append(",")
              .append(escape(primaryReason)).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escape(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
