package com.contractwatch.service;

import com.contractwatch.dto.AnalyticsResponses.*;
import com.contractwatch.dto.RiskScoreResponse;
import com.contractwatch.entity.Contract;
import com.contractwatch.entity.ContractStatus;
import com.contractwatch.repository.ContractRepository;
import com.contractwatch.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final ContractRepository contractRepository;
    private final VendorRepository vendorRepository;
    private final RiskScoreService riskScoreService;

    public List<StatusDistribution> getStatusDistribution() {
        List<Contract> contracts = contractRepository.findAll();
        long total = contracts.size();
        if (total == 0) return List.of();

        Map<ContractStatus, List<Contract>> grouped = contracts.stream()
                .collect(Collectors.groupingBy(Contract::getStatus));

        List<StatusDistribution> list = new ArrayList<>();
        for (ContractStatus status : ContractStatus.values()) {
            List<Contract> subList = grouped.getOrDefault(status, List.of());
            long count = subList.size();
            BigDecimal sum = subList.stream()
                    .map(c -> c.getContractValue() != null ? c.getContractValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            double pct = Math.round((count * 100.0 / total) * 10.0) / 10.0;
            list.add(new StatusDistribution(status.name(), count, sum, pct));
        }
        return list;
    }

    public List<MonthlyExpiry> getMonthlyExpiryForecast() {
        LocalDate today = LocalDate.now();
        List<Contract> activeContracts = contractRepository.findAll().stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE || c.getStatus() == ContractStatus.RENEWAL_DUE)
                .filter(c -> !c.getEndDate().isBefore(today))
                .toList();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, List<Contract>> grouped = activeContracts.stream()
                .collect(Collectors.groupingBy(c -> c.getEndDate().format(formatter), LinkedHashMap::new, Collectors.toList()));

        List<MonthlyExpiry> result = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            LocalDate monthDate = today.plusMonths(i);
            String monthKey = monthDate.format(formatter);
            List<Contract> inMonth = grouped.getOrDefault(monthKey, List.of());
            long count = inMonth.size();
            BigDecimal totalVal = inMonth.stream()
                    .map(c -> c.getContractValue() != null ? c.getContractValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            result.add(new MonthlyExpiry(monthKey, count, totalVal));
        }
        return result;
    }

    public List<VendorShare> getVendorShares() {
        return vendorRepository.findAll().stream()
                .map(v -> {
                    long count = v.getContracts().size();
                    BigDecimal sum = v.getContracts().stream()
                            .map(c -> c.getContractValue() != null ? c.getContractValue() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new VendorShare(v.getName(), count, sum);
                })
                .sorted((a, b) -> b.totalValue().compareTo(a.totalValue()))
                .limit(8)
                .toList();
    }

    public List<RiskDistribution> getRiskDistribution() {
        List<Contract> contracts = contractRepository.findAll().stream()
                .filter(c -> c.getStatus() != ContractStatus.TERMINATED)
                .toList();

        Map<String, List<Contract>> grouped = contracts.stream()
                .collect(Collectors.groupingBy(c -> riskScoreService.calculateRisk(c).riskLevel()));

        List<RiskDistribution> list = new ArrayList<>();
        for (String level : List.of("LOW", "MEDIUM", "HIGH", "CRITICAL")) {
            List<Contract> subList = grouped.getOrDefault(level, List.of());
            long count = subList.size();
            BigDecimal sum = subList.stream()
                    .map(c -> c.getContractValue() != null ? c.getContractValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            list.add(new RiskDistribution(level, count, sum));
        }
        return list;
    }

    public PortfolioMetrics getPortfolioMetrics() {
        List<Contract> all = contractRepository.findAll();
        long total = all.size();
        BigDecimal totalVal = all.stream()
                .map(c -> c.getContractValue() != null ? c.getContractValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal activeVal = all.stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE || c.getStatus() == ContractStatus.RENEWAL_DUE)
                .map(c -> c.getContractValue() != null ? c.getContractValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long renewed = all.stream().filter(c -> c.getStatus() == ContractStatus.RENEWED).count();
        long completedOrLapsed = all.stream().filter(c -> c.getStatus() == ContractStatus.RENEWED || c.getStatus() == ContractStatus.EXPIRED || c.getStatus() == ContractStatus.TERMINATED).count();
        double renewalRate = completedOrLapsed > 0 ? (renewed * 100.0 / completedOrLapsed) : 75.0;

        double avgDuration = all.stream()
                .mapToLong(c -> ChronoUnit.DAYS.between(c.getStartDate(), c.getEndDate()))
                .average()
                .orElse(365.0) / 30.0;

        long critical = 0, high = 0, medium = 0, low = 0;
        for (Contract c : all) {
            if (c.getStatus() == ContractStatus.TERMINATED) continue;
            RiskScoreResponse risk = riskScoreService.calculateRisk(c);
            switch (risk.riskLevel()) {
                case "CRITICAL" -> critical++;
                case "HIGH" -> high++;
                case "MEDIUM" -> medium++;
                case "LOW" -> low++;
            }
        }

        return new PortfolioMetrics(
                total,
                totalVal,
                activeVal,
                Math.round(renewalRate * 10.0) / 10.0,
                Math.round(avgDuration * 10.0) / 10.0,
                critical, high, medium, low
        );
    }
}
