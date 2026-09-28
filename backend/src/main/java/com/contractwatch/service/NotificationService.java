package com.contractwatch.service;

import com.contractwatch.dto.NotificationResponse;
import com.contractwatch.entity.Contract;
import com.contractwatch.entity.Notification;
import com.contractwatch.entity.NotificationType;
import com.contractwatch.exception.ResourceNotFoundException;
import com.contractwatch.mapper.NotificationMapper;
import com.contractwatch.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public Notification createNotification(Contract contract, NotificationType type, String message) {
        log.info("Creating notification [{}] for contract: {}", type, contract.getTitle());
        Notification notification = Notification.builder()
                .contract(contract)
                .type(type)
                .message(message)
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    /**
     * Creates notification only if one of the same type hasn't been created today for this contract.
     * Prevents duplicate scheduler notifications.
     */
    public void createNotificationIfNotExists(Contract contract, NotificationType type, String message) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        boolean exists = notificationRepository
            .findByContractIdAndTypeAndCreatedAtBetween(contract.getId(), type, startOfDay, endOfDay)
            .isPresent();

        if (!exists) {
            createNotification(contract, type, message);
        } else {
            log.debug("Notification of type {} already exists today for contract {}", type, contract.getId());
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        notification.setRead(true);
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    public void markAllAsRead() {
        notificationRepository.markAllAsRead();
    }

    public void clearReadNotifications() {
        notificationRepository.deleteReadNotifications();
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        return notificationRepository.countByReadFalse();
    }
}
