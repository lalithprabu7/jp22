package com.contractwatch.mapper;

import com.contractwatch.dto.AuditEventDto;
import com.contractwatch.entity.AuditEvent;
import org.springframework.stereotype.Component;

@Component
public class AuditEventMapper {

    public AuditEventDto toDto(AuditEvent event) {
        if (event == null) return null;
        return new AuditEventDto(
            event.getId(),
            event.getContract() != null ? event.getContract().getId() : null,
            event.getContract() != null ? event.getContract().getContractNumber() : null,
            event.getEventType(),
            event.getDescription(),
            event.getPerformedBy(),
            event.getCreatedAt()
        );
    }
}
