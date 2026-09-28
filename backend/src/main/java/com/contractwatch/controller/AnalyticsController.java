package com.contractwatch.controller;

import com.contractwatch.dto.AnalyticsResponses.*;
import com.contractwatch.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Contract portfolio analytics and financial metrics APIs")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/status")
    @Operation(summary = "Contract status distribution", description = "Returns count and value distribution grouped by contract lifecycle status")
    public ResponseEntity<List<StatusDistribution>> getStatusDistribution() {
        return ResponseEntity.ok(analyticsService.getStatusDistribution());
    }

    @GetMapping("/expiry")
    @Operation(summary = "Monthly expiry forecast", description = "12-month forward projection of expiring contracts and financial value")
    public ResponseEntity<List<MonthlyExpiry>> getMonthlyExpiryForecast() {
        return ResponseEntity.ok(analyticsService.getMonthlyExpiryForecast());
    }

    @GetMapping("/vendors")
    @Operation(summary = "Contracts and spend by vendor", description = "Top vendor spend and contract counts")
    public ResponseEntity<List<VendorShare>> getVendorShares() {
        return ResponseEntity.ok(analyticsService.getVendorShares());
    }

    @GetMapping("/risk")
    @Operation(summary = "Renewal risk distribution", description = "Breakdown of contract portfolio across LOW, MEDIUM, HIGH, and CRITICAL risk tiers")
    public ResponseEntity<List<RiskDistribution>> getRiskDistribution() {
        return ResponseEntity.ok(analyticsService.getRiskDistribution());
    }

    @GetMapping("/metrics")
    @Operation(summary = "Overall portfolio metrics", description = "Key executive KPIs including total spend, active spend, renewal rate, and average duration")
    public ResponseEntity<PortfolioMetrics> getPortfolioMetrics() {
        return ResponseEntity.ok(analyticsService.getPortfolioMetrics());
    }
}
