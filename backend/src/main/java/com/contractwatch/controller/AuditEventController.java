package com.contractwatch.controller;

import com.contractwatch.dto.AuditEventDto;
import com.contractwatch.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts/{contractId}/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Events", description = "Contract audit trail and timeline APIs")
@CrossOrigin(origins = "*")
public class AuditEventController {

    private final ContractService contractService;

    @GetMapping
    @Operation(summary = "Get contract audit timeline", description = "Returns the chronological timeline of all events and lifecycle changes for a contract")
    public ResponseEntity<List<AuditEventDto>> getAuditTimeline(@PathVariable Long contractId) {
        return ResponseEntity.ok(contractService.getAuditTimeline(contractId));
    }
}
