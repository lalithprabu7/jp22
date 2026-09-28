package com.contractwatch.controller;

import com.contractwatch.dto.CreateDocumentRequest;
import com.contractwatch.dto.DocumentDto;
import com.contractwatch.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Contract document and attachment management APIs")
@CrossOrigin(origins = "*")
public class DocumentController {

    private final ContractService contractService;

    @GetMapping("/documents")
    @Operation(summary = "List all documents", description = "Retrieves all document attachments across the entire contract repository")
    public ResponseEntity<List<DocumentDto>> getAllDocuments() {
        return ResponseEntity.ok(contractService.getAllDocuments());
    }

    @GetMapping("/contracts/{contractId}/documents")
    @Operation(summary = "List documents for a contract", description = "Retrieves all document attachments, MSAs, and invoices for a contract")
    public ResponseEntity<List<DocumentDto>> getDocuments(@PathVariable Long contractId) {
        return ResponseEntity.ok(contractService.getDocuments(contractId));
    }

    @PostMapping("/contracts/{contractId}/documents")
    @Operation(summary = "Upload or register a document reference", description = "Attaches a new document reference to a contract")
    public ResponseEntity<DocumentDto> addDocument(
            @PathVariable Long contractId,
            @Valid @RequestBody CreateDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contractService.addDocument(contractId, request));
    }

    @DeleteMapping("/documents/{id}")
    @Operation(summary = "Remove document", description = "Deletes a document reference from the contract repository")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        contractService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
