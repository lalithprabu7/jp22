package com.contractwatch.controller;

import com.contractwatch.dto.*;
import com.contractwatch.entity.ContractStatus;
import com.contractwatch.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
@Tag(name = "Contracts", description = "Contract management APIs")
@CrossOrigin(origins = "*")
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    @Operation(summary = "Create a new contract")
    public ResponseEntity<ContractResponse> createContract(@Valid @RequestBody CreateContractRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contractService.createContract(request));
    }

    @GetMapping
    @Operation(summary = "Get all contracts")
    public ResponseEntity<List<ContractResponse>> getAllContracts() {
        return ResponseEntity.ok(contractService.getAllContracts());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get contract by ID")
    public ResponseEntity<ContractResponse> getContractById(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update contract")
    public ResponseEntity<ContractResponse> updateContract(
            @PathVariable Long id, @Valid @RequestBody UpdateContractRequest request) {
        return ResponseEntity.ok(contractService.updateContract(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete contract")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        contractService.deleteContract(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/expiring")
    @Operation(summary = "Get contracts expiring within N days (excludes TERMINATED)")
    public ResponseEntity<List<ContractResponse>> getExpiringContracts(
            @Parameter(description = "Number of days to look ahead")
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(contractService.getExpiringContracts(days));
    }

    @GetMapping("/renewal-due")
    @Operation(summary = "Get contracts currently in renewal window (excludes TERMINATED)")
    public ResponseEntity<List<ContractResponse>> getRenewalDueContracts() {
        return ResponseEntity.ok(contractService.getRenewalDueContracts());
    }

    @GetMapping("/active")
    @Operation(summary = "Get active contracts")
    public ResponseEntity<List<ContractResponse>> getActiveContracts() {
        return ResponseEntity.ok(contractService.getActiveContracts());
    }

    @GetMapping("/terminated")
    @Operation(summary = "Get terminated contracts")
    public ResponseEntity<List<ContractResponse>> getTerminatedContracts() {
        return ResponseEntity.ok(contractService.getContractsByStatus(ContractStatus.TERMINATED));
    }

    @GetMapping("/expired")
    @Operation(summary = "Get expired contracts")
    public ResponseEntity<List<ContractResponse>> getExpiredContracts() {
        return ResponseEntity.ok(contractService.getContractsByStatus(ContractStatus.EXPIRED));
    }

    @PostMapping("/{id}/renew")
    @Operation(summary = "Renew a contract — enforces business rules")
    public ResponseEntity<ContractResponse> renewContract(
            @PathVariable Long id, @Valid @RequestBody RenewalRequest request) {
        return ResponseEntity.ok(contractService.renewContract(id, request));
    }

    @PostMapping("/{id}/terminate")
    @Operation(summary = "Terminate a contract — removes from active renewal reminders")
    public ResponseEntity<ContractResponse> terminateContract(
            @PathVariable Long id, @Valid @RequestBody TerminationRequest request) {
        return ResponseEntity.ok(contractService.terminateContract(id, request));
    }

    @GetMapping("/{id}/decisions")
    @Operation(summary = "Get renewal/termination decision history for a contract")
    public ResponseEntity<List<RenewalDecisionResponse>> getDecisions(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getDecisions(id));
    }

    @PostMapping("/{id}/document-reference")
    @Operation(summary = "Add or update document reference for a contract")
    public ResponseEntity<ContractResponse> addDocumentReference(
            @PathVariable Long id, @RequestBody DocumentReferenceRequest request) {
        return ResponseEntity.ok(contractService.addDocumentReference(id, request));
    }

    @GetMapping("/{id}/document-reference")
    @Operation(summary = "Get document reference for a contract")
    public ResponseEntity<ContractResponse> getDocumentReference(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id));
    }
}
