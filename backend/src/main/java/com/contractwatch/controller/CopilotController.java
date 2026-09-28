package com.contractwatch.controller;

import com.contractwatch.copilot.CopilotEngine;
import com.contractwatch.dto.CopilotRequest;
import com.contractwatch.dto.CopilotResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/copilot")
@RequiredArgsConstructor
@Tag(name = "Copilot", description = "ContractWatch AI Copilot APIs")
@CrossOrigin(origins = "*")
public class CopilotController {

    private final CopilotEngine copilotEngine;

    @PostMapping("/chat")
    @Operation(summary = "Chat with ContractWatch AI Copilot",
               description = "Send a natural language message and receive a response with real contract data")
    public ResponseEntity<CopilotResponse> chat(@Valid @RequestBody CopilotRequest request) {
        CopilotResponse response = copilotEngine.chat(request.message());
        return ResponseEntity.ok(response);
    }
}
