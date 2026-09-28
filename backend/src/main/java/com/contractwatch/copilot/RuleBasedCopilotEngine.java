package com.contractwatch.copilot;

import com.contractwatch.dto.ContractResponse;
import com.contractwatch.dto.CopilotResponse;
import com.contractwatch.dto.VendorResponse;
import com.contractwatch.entity.ContractStatus;
import com.contractwatch.repository.ContractRepository;
import com.contractwatch.repository.VendorRepository;
import com.contractwatch.mapper.ContractMapper;
import com.contractwatch.mapper.VendorMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Rule-based Copilot engine using keyword/intent detection.
 *
 * Intent detection is performed by matching common keywords and phrases.
 * All responses are generated from live database data.
 *
 * Architecture is designed so that an LLM can be plugged in (via LLMCopilotEngine)
 * without changing the rest of the system.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RuleBasedCopilotEngine implements CopilotEngine {

    private final ContractRepository contractRepository;
    private final VendorRepository vendorRepository;
    private final ContractMapper contractMapper;
    private final VendorMapper vendorMapper;

    @Override
    public CopilotResponse chat(String userMessage) {
        String msg = userMessage.toLowerCase().trim();
        log.info("[Copilot] Processing: {}", userMessage);

        String intent = detectIntent(msg);
        return switch (intent) {
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
        if (contains(msg, "expir", "expiring", "expire", "days remaining", "next 30", "next 7", "next 14", "soon")) {
            return "EXPIRING_CONTRACTS";
        }
        if (contains(msg, "renewal due", "renewal window", "renewal attention", "need renewal", "due for renewal")) {
            return "RENEWAL_DUE";
        }
        if (contains(msg, "terminat")) {
            return "TERMINATED";
        }
        if (contains(msg, "expired", "already expired", "past expiry")) {
            return "EXPIRED";
        }
        if (contains(msg, "active contract", "currently active", "all active")) {
            return "ACTIVE";
        }
        if (contains(msg, "risk", "renewal risk", "at risk", "summarize renewal")) {
            return "RENEWAL_RISKS";
        }
        if (contains(msg, "summarize", "summary", "overview", "how many", "total", "count")) {
            return "SUMMARY";
        }
        if (contains(msg, "vendor", "which vendor", "most contract", "most active")) {
            return "VENDOR_MOST";
        }
        if (contains(msg, "urgent", "immediate", "critical", "highest urgency", "priority")) {
            return "URGENT";
        }
        if (contains(msg, "all contract", "list all", "show all", "all vendor")) {
            return "ALL_CONTRACTS";
        }
        return "UNKNOWN";
    }

    private boolean contains(String msg, String... keywords) {
        return Arrays.stream(keywords).anyMatch(msg::contains);
    }

    // ─── INTENT HANDLERS ─────────────────────────────────────────────────────────

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
                    "🔴 High Expiry Risk",
                    contracts.size() + " contracts expiring in " + days + " days require immediate attention."
                );
            }
        }
        return new CopilotResponse(message, "EXPIRING_CONTRACTS", contracts, insight);
    }

    private CopilotResponse handleRenewalDue() {
        List<ContractResponse> contracts = contractRepository
            .findByStatus(ContractStatus.RENEWAL_DUE)
            .stream().map(contractMapper::toResponse).toList();

        String message = contracts.isEmpty()
            ? "No contracts are currently in the renewal window. All looks good! ✅"
            : "**" + contracts.size() + " contract(s)** are currently in the renewal window and require a decision (Renew or Terminate).";

        CopilotResponse.InsightCard insight = contracts.isEmpty() ? null :
            new CopilotResponse.InsightCard(
                "WARNING",
                "🟠 Renewal Action Required",
                contracts.size() + " contracts need a renewal decision."
            );

        return new CopilotResponse(message, "RENEWAL_DUE", contracts, insight);
    }

    private CopilotResponse handleTerminated() {
        List<ContractResponse> contracts = contractRepository
            .findByStatus(ContractStatus.TERMINATED)
            .stream().map(contractMapper::toResponse).toList();

        String message = contracts.isEmpty()
            ? "No terminated contracts found."
            : "Found **" + contracts.size() + " terminated contract(s)**.";

        return new CopilotResponse(message, "TERMINATED", contracts, null);
    }

    private CopilotResponse handleExpired() {
        List<ContractResponse> contracts = contractRepository
            .findByStatus(ContractStatus.EXPIRED)
            .stream().map(contractMapper::toResponse).toList();

        String message = contracts.isEmpty()
            ? "No expired contracts found."
            : "**" + contracts.size() + " contract(s)** have expired and were not renewed or terminated.";

        return new CopilotResponse(message, "EXPIRED", contracts, null);
    }

    private CopilotResponse handleActive() {
        List<ContractResponse> contracts = contractRepository
            .findActiveContracts()
            .stream().map(contractMapper::toResponse).toList();

        return new CopilotResponse(
            "You have **" + contracts.size() + " active contract(s)** currently in good standing.",
            "ACTIVE", contracts, null
        );
    }

    private CopilotResponse handleRenewalRisks() {
        LocalDate today = LocalDate.now();
        long renewalDue = contractRepository.countByStatus(ContractStatus.RENEWAL_DUE);
        long expiring30 = contractRepository.findExpiringBetween(today, today.plusDays(30)).size();
        long total = contractRepository.count();
        long active = contractRepository.findActiveContracts().size();

        double healthPct = total > 0 ? (double) active / total * 100 : 100;

        List<ContractResponse> atRisk = contractRepository
            .findExpiringBetween(today, today.plusDays(30))
            .stream().map(contractMapper::toResponse).toList();

        String message = String.format(
            "**Renewal Risk Summary:**\n\n" +
            "🔴 **%d contract(s)** currently in renewal window\n" +
            "🟠 **%d contract(s)** expiring within 30 days\n" +
            "🟢 **%.0f%%** of active contracts are outside the renewal window\n\n" +
            "I recommend reviewing all renewal-due contracts immediately.",
            renewalDue, expiring30, healthPct
        );

        CopilotResponse.InsightCard insight;
        if (renewalDue > 3 || expiring30 > 5) {
            insight = new CopilotResponse.InsightCard("HIGH_RISK", "🔴 High Risk",
                renewalDue + " contracts need immediate attention.");
        } else if (renewalDue > 0 || expiring30 > 0) {
            insight = new CopilotResponse.InsightCard("WARNING", "🟠 Upcoming Renewals",
                expiring30 + " contracts enter renewal window this month.");
        } else {
            insight = new CopilotResponse.InsightCard("HEALTHY", "🟢 Portfolio Healthy",
                String.format("%.0f%% of active contracts are outside renewal window.", healthPct));
        }

        return new CopilotResponse(message, "RENEWAL_RISKS", atRisk, insight);
    }

    private CopilotResponse handleSummary() {
        long total = contractRepository.count();
        long active = contractRepository.countByStatus(ContractStatus.ACTIVE);
        long renewalDue = contractRepository.countByStatus(ContractStatus.RENEWAL_DUE);
        long expired = contractRepository.countByStatus(ContractStatus.EXPIRED);
        long terminated = contractRepository.countByStatus(ContractStatus.TERMINATED);
        long renewed = contractRepository.countByStatus(ContractStatus.RENEWED);

        String message = String.format(
            "**ContractWatch Portfolio Summary:**\n\n" +
            "📄 Total Contracts: **%d**\n" +
            "✅ Active: **%d**\n" +
            "🔔 Renewal Due: **%d**\n" +
            "🔄 Renewed: **%d**\n" +
            "❌ Terminated: **%d**\n" +
            "⏰ Expired: **%d**",
            total, active, renewalDue, renewed, terminated, expired
        );

        return new CopilotResponse(message, "SUMMARY", List.of(), null);
    }

    private CopilotResponse handleVendorWithMost() {
        List<Object[]> results = vendorRepository.findAll().stream()
            .map(v -> new Object[]{v.getName(), v.getContracts().size()})
            .sorted((a, b) -> Integer.compare((int) b[1], (int) a[1]))
            .toList();

        if (results.isEmpty()) {
            return new CopilotResponse("No vendors found.", "VENDOR_MOST", List.of(), null);
        }

        String topVendor = (String) results.get(0)[0];
        int count = (int) results.get(0)[1];

        String message = "**" + topVendor + "** has the most contracts with **" + count + " contract(s)**.\n\n" +
            "Here's the vendor breakdown:\n" +
            results.stream()
                .map(r -> "• " + r[0] + ": " + r[1] + " contract(s)")
                .collect(Collectors.joining("\n"));

        List<VendorResponse> vendors = vendorRepository.findAll().stream()
            .map(vendorMapper::toResponse)
            .sorted(Comparator.comparingInt(VendorResponse::totalContracts).reversed())
            .toList();

        return new CopilotResponse(message, "VENDOR_MOST", vendors, null);
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

        return new CopilotResponse(message, "URGENT", urgent, insight);
    }

    private CopilotResponse handleAllContracts() {
        List<ContractResponse> contracts = contractRepository.findAll().stream()
            .map(contractMapper::toResponse).toList();
        return new CopilotResponse(
            "Here are all **" + contracts.size() + " contract(s)** in the system.",
            "ALL_CONTRACTS", contracts, null
        );
    }

    private CopilotResponse handleUnknown(String original) {
        return new CopilotResponse(
            "I'm not sure I understood that. Here are some things I can help you with:\n\n" +
            "• \"Which contracts are expiring in the next 30 days?\"\n" +
            "• \"Show renewal due contracts\"\n" +
            "• \"Summarize my renewal risks\"\n" +
            "• \"Which vendor has the most contracts?\"\n" +
            "• \"Show terminated contracts\"\n" +
            "• \"Show urgent contracts\"\n" +
            "• \"Give me a portfolio summary\"",
            "UNKNOWN", List.of(), null
        );
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────────

    private int extractDays(String msg, int defaultDays) {
        // Try to extract number from message: "next 7 days", "within 14 days", etc.
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
