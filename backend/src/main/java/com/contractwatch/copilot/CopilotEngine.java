package com.contractwatch.copilot;

import com.contractwatch.dto.CopilotResponse;

/**
 * CopilotEngine interface — designed for extensibility.
 *
 * Current implementation: RuleBasedCopilotEngine (keyword-based intent detection).
 * Future implementation: LLMCopilotEngine (OpenAI/Gemini integration).
 *
 * The application does NOT depend on an external API key to function.
 */
public interface CopilotEngine {
    CopilotResponse chat(String userMessage);
}
