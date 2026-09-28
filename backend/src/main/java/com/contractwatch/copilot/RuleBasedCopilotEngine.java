package com.contractwatch.copilot;

import com.contractwatch.dto.ContractResponse;
import com.contractwatch.dto.CopilotResponse;
import com.contractwatch.dto.RiskScoreResponse;
import com.contractwatch.dto.VendorResponse;
import com.contractwatch.entity.Contract;
import com.contractwatch.entity.ContractStatus;
import com.contractwatch.mapper.ContractMapper;
import com.contractwatch.mapper.VendorMapper;
import com.contractwatch.repository.ContractRepository;
import com.contractwatch.repository.VendorRepository;
import com.contractwatch.service.RiskScoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RuleBasedCopilotEngine implements CopilotEngine {

    private final ContractRepository contractRepository;
    private final VendorRepository vendorRepository;
    private final ContractMapper contractMapper;
    private final VendorMapper vendorMapper;
    private final RiskScoreService riskScoreService;

    public static final List<String> DEFAULT_SUGGESTIONS = List.of(
        "Which contracts expire in the next 30 days?",
        "What should I review today?",
        "Show high risk contracts",
        "Give me today's contract priorities",
        "Show contracts worth more than ₹5 lakh",
        "Which vendor has the most contracts?",
        "Summarize my renewal risks",
        "Show renewal due contracts"
    );

    @Override
    public CopilotResponse chat(String userMessage) {
        String msg = userMessage == null ? "" : userMessage.toLowerCase().trim();
        log.info("[Copilot] Processing user query: {}", userMessage);

        String intent = detectIntent(msg);
        return switch (intent) {
            case "PRIORITIES"          -> handlePriorities();
            case "HIGH_RISK"           -> handleHighRisk();
            case "HIGH_VALUE"          -> handleHighValue();
            case "EXPIRING_CONTRACTS"  -> handleExpiring(msg);
            case "RENEWAL_DUE"         -> handleRenewalDue();
            case "TERMINATED"          -> handleTerminated();
            case "EXPIRED"             -> handleExpired();
            case "ACTIVE"              -> handleActive();
            case "RENEWAL_RISKS"       -> handleRenewalRisks();
            case "SUMMARY"             -> handleSummary();
            case "VENDOR_MOST"         -> handleVendorWithMost();
            case "URGENT"              -> handleUrgent();
            case "ALL_CONTRACTS"       -> handleAllContracts();
            default                    -> handleUnknown(userMessage);
        };
    }

    // ─── INTENT DETECTION ────────────────────────────────────────────────────────

    private String detectIntent(String msg) {
        if (contains(msg, "today", "priority", "priorities", "what should i review", "review today", "action today")) {
            return "PRIORITIES";
        }
        if (contains(msg, "high risk", "critical risk", "risk score", "most risky")) {
            return "HIGH_RISK";
        }
        if (contains(msg, "5 lakh", "500000", "500,000", "high value", "expensive", "highest value", "worth more than")) {
            return "HIGH_VALUE";
        }
        if (contains(msg, "expir", "expiring", "expire", "days remaining", "next 30", "next 7", "next 14", "less than 15", "this month", "soon")) {
            return "EXPIRING_CONTRACTS";
        }
        if (contains(msg, "renewal due", "renewal window", "renewal attention", "need renewal", "due for renewal")) {
            return "RENEWAL_DUE";
        }
        if (contains(msg, "terminat")) {
            return "TERMINATED";
        }
        if (contains(msg, "already expired", "past expiry", "expired")) {
            return "EXPIRED";
        }
        if (contains(msg, "how many active", "active contract", "currently active", "all active")) {
            return "ACTIVE";
        }
        if (contains(msg, "risk", "renewal risk", "at risk", "summarize renewal")) {
            return "RENEWAL_RISKS";
        }
        if (contains(msg, "summarize", "summary", "overview", "how many", "total count")) {
            return "SUMMARY";
        }
        if (contains(msg, "vendor", "which vendor", "most contract", "most active")) {
            return "VENDOR_MOST";
        }
        if (contains(msg, "urgent", "immediate", "critical", "highest urgency")) {
            return "URGENT";
        }
        if (contains(msg, "all contract", "list all", "show all")) {
            return "ALL_CONTRACTS";
        }
        return "UNKNOWN";
    }

    private boolean contains(String msg, String... keywords) {
        return Arrays.stream(keywords).anyMatch(msg::contains);
    }

    // ─── INTENT HANDLERS ─────────────────────────────────────────────────────────

    private CopilotResponse handlePriorities() {
        LocalDate today = LocalDate.now();
        List<Contract> contracts = contractRepository.findAll().stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE || c.getStatus() == ContractStatus.RENEWAL_DUE)
                .sorted(Comparator.comparing(Contract::getEndDate))
                .limit(5)
                .toList();

        List<ContractResponse> responses = contracts.stream().map(contractMapper::toResponse).toList();
        String message = "Here are **today's top contract priorities** needing your attention:\n\n" +
                responses.stream()
                        .map(c -> "• **" + c.title() + "** (" + c.vendorName() + ") — Expires in " + c.daysUntilExpiry() + " days [" + c.riskLevel() + " Risk]")
                        .collect(Collectors.joining("\n"));

        CopilotResponse.InsightCard insight = new CopilotResponse.InsightCard(
                "WARNING",
                "⚡ Priority Actions",
                responses.size() + " contracts require review or decision making today."
        );

        return new CopilotResponse(message, "PRIORITIES", responses, insight, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleHighRisk() {
        List<Contract> highRisk = contractRepository.findAll().stream()
                .filter(c -> c.getStatus() != ContractStatus.TERMINATED)
                .filter(c -> {
                    RiskScoreResponse r = riskScoreService.calculateRisk(c);
                    return "CRITICAL".equals(r.riskLevel()) || "HIGH".equals(r.riskLevel());
                })
                .sorted((a, b) -> Integer.compare(riskScoreService.calculateRisk(b).riskScore(), riskScoreService.calculateRisk(a).riskScore()))
                .toList();

        List<ContractResponse> responses = highRisk.stream().map(contractMapper::toResponse).toList();
        String message = responses.isEmpty()
                ? "Excellent! No contracts currently qualify as High or Critical Risk. Portfolio health is strong."
                : "Identified **" + responses.size() + " high/critical risk contract(s)** based on expiration proximity, missing documentation, and commitment size.";

        CopilotResponse.InsightCard insight = responses.isEmpty() ? null :
                new CopilotResponse.InsightCard("HIGH_RISK", "🔴 Critical Risk Detected", responses.size() + " contracts have elevated risk scores.");

        return new CopilotResponse(message, "HIGH_RISK", responses, insight, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleHighValue() {
        BigDecimal threshold = new BigDecimal("500000"); // 5 Lakh
        List<Contract> highVal = contractRepository.findAll().stream()
                .filter(c -> c.getContractValue() != null && c.getContractValue().compareTo(threshold) >= 0)
                .sorted((a, b) -> b.getContractValue().compareTo(a.getContractValue()))
                .toList();

        List<ContractResponse> responses = highVal.stream().map(contractMapper::toResponse).toList();
        String message = "Found **" + responses.size() + " major contract(s)** with commitment value $\\ge$ ₹5,00,000.";

        return new CopilotResponse(message, "HIGH_VALUE", responses, null, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleExpiring(String msg) {
        int days = extractDays(msg, 30);
        LocalDate today = LocalDate.now();
        List<ContractResponse> contracts = contractRepository
            .findExpiringBetween(today, today.plusDays(days))
            .stream().map(contractMapper::toResponse).toList();

        String message;
        CopilotResponse.InsightCard insight = null;

        if (contracts.isEmpty()) {
            message = "Great news! No contracts are expiring in the next " + days + " days. All contracts are healthy.";
        } else {
            message = "Found **" + contracts.size() + " contract(s)** expiring within the next " +
                      days + " days. I recommend reviewing these immediately.";
            if (contracts.size() >= 3) {
                insight = new CopilotResponse.InsightCard(
                    "HIGH_RISK",
                    "🔴 Expiry Alert",
                    contracts.size() + " contracts expiring in " + days + " days require immediate attention."
                );
            }
        }
        return new CopilotResponse(message, "EXPIRING_CONTRACTS", contracts, insight, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleRenewalDue() {
        List<ContractResponse> contracts = contractRepository
            .findByStatus(ContractStatus.RENEWAL_DUE)
            .stream().map(contractMapper::toResponse).toList();

        String message = contracts.isEmpty()
            ? "No contracts are currently in the renewal window. All looks good! ✅"
            : "**" + contracts.size() + " contract(s)** are currently in the renewal window and require an action (Renew or Terminate).";

        CopilotResponse.InsightCard insight = contracts.isEmpty() ? null :
            new CopilotResponse.InsightCard(
                "WARNING",
                "🟠 Renewal Action Required",
                contracts.size() + " contracts need a renewal decision."
            );

        return new CopilotResponse(message, "RENEWAL_DUE", contracts, insight, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleTerminated() {
        List<ContractResponse> contracts = contractRepository
            .findByStatus(ContractStatus.TERMINATED)
            .stream().map(contractMapper::toResponse).toList();

        String message = contracts.isEmpty()
            ? "No terminated contracts found."
            : "Found **" + contracts.size() + " terminated contract(s)**. Terminated contracts are preserved for audit purposes and excluded from active renewal workflows.";

        return new CopilotResponse(message, "TERMINATED", contracts, null, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleExpired() {
        List<ContractResponse> contracts = contractRepository
            .findByStatus(ContractStatus.EXPIRED)
            .stream().map(contractMapper::toResponse).toList();

        String message = contracts.isEmpty()
            ? "No expired contracts found."
            : "**" + contracts.size() + " contract(s)** have lapsed past their end date without renewal.";

        return new CopilotResponse(message, "EXPIRED", contracts, null, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleActive() {
        List<ContractResponse> contracts = contractRepository
            .findActiveContracts()
            .stream().map(contractMapper::toResponse).toList();

        String message = "There are currently **" + contracts.size() + " active contract(s)** across your vendor ecosystem.";
        return new CopilotResponse(message, "ACTIVE", contracts, null, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleRenewalRisks() {
        LocalDate today = LocalDate.now();
        List<Contract> due = contractRepository.findByStatus(ContractStatus.RENEWAL_DUE);
        List<Contract> expiringSoon = contractRepository.findExpiringBetween(today, today.plusDays(30));

        Set<Contract> riskSet = new LinkedHashSet<>(due);
        riskSet.addAll(expiringSoon);

        List<ContractResponse> atRisk = riskSet.stream()
            .map(contractMapper::toResponse)
            .toList();

        String message = "### Renewal Risk Summary\n\n" +
            "• **" + due.size() + " contract(s)** currently in the renewal review window\n" +
            "• **" + expiringSoon.size() + " contract(s)** expiring within 30 days\n\n" +
            "Total contracts requiring review: **" + atRisk.size() + "**";

        CopilotResponse.InsightCard insight = new CopilotResponse.InsightCard(
            "HIGH_RISK",
            "⚠️ Attention Needed",
            "You have " + atRisk.size() + " contracts requiring review before deadlines pass."
        );

        return new CopilotResponse(message, "RENEWAL_RISKS", atRisk, insight, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleSummary() {
        long total = contractRepository.count();
        long active = contractRepository.countByStatus(ContractStatus.ACTIVE);
        long renewalDue = contractRepository.countByStatus(ContractStatus.RENEWAL_DUE);
        long expired = contractRepository.countByStatus(ContractStatus.EXPIRED);
        long terminated = contractRepository.countByStatus(ContractStatus.TERMINATED);
        long renewed = contractRepository.countByStatus(ContractStatus.RENEWED);

        String message = "### Contract Portfolio Overview\n\n" +
            "| Status | Count |\n" +
            "|--------|-------|\n" +
            "| Active | " + active + " |\n" +
            "| Renewal Due | " + renewalDue + " |\n" +
            "| Renewed | " + renewed + " |\n" +
            "| Expired | " + expired + " |\n" +
            "| Terminated | " + terminated + " |\n" +
            "| **Total** | **" + total + "** |";

        return new CopilotResponse(message, "SUMMARY", List.of(), null, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleVendorWithMost() {
        List<Object[]> results = vendorRepository.findAll().stream()
            .map(v -> new Object[]{v.getName(), v.getContracts().size()})
            .sorted((a, b) -> Integer.compare((int) b[1], (int) a[1]))
            .toList();

        if (results.isEmpty()) {
            return new CopilotResponse("No vendors found.", "VENDOR_MOST", List.of(), null, DEFAULT_SUGGESTIONS);
        }

        String topVendor = (String) results.get(0)[0];
        int count = (int) results.get(0)[1];

        String message = "**" + topVendor + "** has the most contracts with **" + count + " contract(s)**.\n\n" +
            "Top vendor breakdown:\n" +
            results.stream()
                .map(r -> "• " + r[0] + ": " + r[1] + " contract(s)")
                .collect(Collectors.joining("\n"));

        List<VendorResponse> vendors = vendorRepository.findAll().stream()
            .map(vendorMapper::toResponse)
            .sorted(Comparator.comparingInt(VendorResponse::totalContracts).reversed())
            .toList();

        return new CopilotResponse(message, "VENDOR_MOST", vendors, null, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleUrgent() {
        LocalDate today = LocalDate.now();
        List<ContractResponse> urgent = contractRepository
            .findExpiringBetween(today, today.plusDays(15))
            .stream().map(contractMapper::toResponse)
            .sorted(Comparator.comparingLong(ContractResponse::daysUntilExpiry))
            .toList();

        String message = urgent.isEmpty()
            ? "No contracts require urgent attention right now. ✅"
            : "⚠️ **" + urgent.size() + " contract(s)** require urgent attention (expiring within 15 days)!";

        CopilotResponse.InsightCard insight = urgent.isEmpty() ? null :
            new CopilotResponse.InsightCard("HIGH_RISK", "🔴 Critical",
                urgent.size() + " contracts require immediate renewal action.");

        return new CopilotResponse(message, "URGENT", urgent, insight, DEFAULT_SUGGESTIONS);
    }

    private CopilotResponse handleAllContracts() {
        List<ContractResponse> contracts = contractRepository.findAll().stream()
            .map(contractMapper::toResponse).toList();
        return new CopilotResponse(
            "Here are all **" + contracts.size() + " contract(s)** in the system.",
            "ALL_CONTRACTS", contracts, null, DEFAULT_SUGGESTIONS
        );
    }

    private CopilotResponse handleUnknown(String original) {
        return new CopilotResponse(
            "I'm not sure I understood that. Click any of the suggested prompts below, or try asking:\n\n" +
            "• \"Which contracts are expiring in the next 30 days?\"\n" +
            "• \"What should I review today?\"\n" +
            "• \"Show high risk contracts\"\n" +
            "• \"Give me today's contract priorities\"\n" +
            "• \"Show contracts worth more than ₹5 lakh\"\n" +
            "• \"Which vendor has the most contracts?\"\n" +
            "• \"Summarize my renewal risks\"",
            "UNKNOWN", List.of(), null, DEFAULT_SUGGESTIONS
        );
    }

    private int extractDays(String msg, int defaultDays) {
        String[] words = msg.split("\\s+");
        for (int i = 0; i < words.length - 1; i++) {
            try {
                int num = Integer.parseInt(words[i].replaceAll("[^0-9]", ""));
                if (num > 0 && num <= 365) return num;
            } catch (NumberFormatException ignored) {}
        }
        return defaultDays;
    }
}
