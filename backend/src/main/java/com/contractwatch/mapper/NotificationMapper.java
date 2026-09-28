package com.contractwatch.mapper;

import com.contractwatch.dto.NotificationResponse;
import com.contractwatch.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        String contractTitle = notification.getContract() != null
                ? notification.getContract().getTitle() : null;
        String contractNumber = notification.getContract() != null
                ? notification.getContract().getContractNumber() : null;
        Long contractId = notification.getContract() != null
                ? notification.getContract().getId() : null;

        return new NotificationResponse(
                notification.getId(),
                contractId,
                contractTitle,
                contractNumber,
                notification.getType(),
                notification.getMessage(),
                notification.getCreatedAt(),
                notification.getRead()
        );
    }
}
