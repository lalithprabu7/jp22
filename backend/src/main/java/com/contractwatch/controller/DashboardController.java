package com.contractwatch.controller;

import com.contractwatch.dto.DashboardSummary;
import com.contractwatch.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard summary APIs")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ContractService contractService;

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary statistics")
    public ResponseEntity<DashboardSummary> getSummary() {
        return ResponseEntity.ok(contractService.getDashboardSummary());
    }
}
