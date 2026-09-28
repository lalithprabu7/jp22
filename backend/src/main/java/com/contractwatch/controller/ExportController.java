package com.contractwatch.controller;

import com.contractwatch.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Export reports in CSV and spreadsheet formats")
@CrossOrigin(origins = "*")
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/contracts")
    @Operation(summary = "Export contract register CSV", description = "Generates a downloadable CSV register of all contracts")
    public ResponseEntity<byte[]> exportContracts() {
        byte[] csv = exportService.exportContractsCsv();
        String filename = "contractwatch-contracts-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/renewals")
    @Operation(summary = "Export renewals report CSV", description = "Generates a downloadable CSV report of contracts due for renewal")
    public ResponseEntity<byte[]> exportRenewals() {
        byte[] csv = exportService.exportRenewalsCsv();
        String filename = "contractwatch-renewals-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/risks")
    @Operation(summary = "Export risk analysis report CSV", description = "Generates a downloadable CSV report with risk scores and reasons")
    public ResponseEntity<byte[]> exportRisks() {
        byte[] csv = exportService.exportRiskReportCsv();
        String filename = "contractwatch-risk-report-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
