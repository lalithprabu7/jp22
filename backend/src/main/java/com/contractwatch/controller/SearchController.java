package com.contractwatch.controller;

import com.contractwatch.dto.GlobalSearchResponse;
import com.contractwatch.service.GlobalSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Tag(name = "Search", description = "Global multi-entity search APIs")
@CrossOrigin(origins = "*")
public class SearchController {

    private final GlobalSearchService globalSearchService;

    @GetMapping
    @Operation(summary = "Global search", description = "Search simultaneously across contracts, vendors, and document attachments")
    public ResponseEntity<GlobalSearchResponse> search(@RequestParam(name = "q", defaultValue = "") String query) {
        return ResponseEntity.ok(globalSearchService.search(query));
    }
}
