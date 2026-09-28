package com.contractwatch.mapper;

import com.contractwatch.dto.RenewalDecisionResponse;
import com.contractwatch.entity.RenewalDecision;
import org.springframework.stereotype.Component;

@Component
public class RenewalDecisionMapper {

    public RenewalDecisionResponse toResponse(RenewalDecision decision) {
        return new RenewalDecisionResponse(
                decision.getId(),
                decision.getContract().getId(),
                decision.getContract().getTitle(),
                decision.getContract().getContractNumber(),
                decision.getDecision(),
                decision.getDecisionDate(),
                decision.getNewEndDate(),
                decision.getRemarks(),
                decision.getCreatedAt()
        );
    }
}
