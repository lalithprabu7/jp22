package com.contractwatch.repository;

import com.contractwatch.entity.Notification;
import com.contractwatch.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByOrderByCreatedAtDesc();
    List<Notification> findByReadFalseOrderByCreatedAtDesc();

    /**
     * Check if a notification of a specific type already exists for a contract on a given day,
     * to prevent duplicate notifications from the scheduler.
     */
    Optional<Notification> findByContractIdAndTypeAndCreatedAtBetween(
        Long contractId, NotificationType type, LocalDateTime from, LocalDateTime to
    );

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.read = false OR n.read IS NULL")
    long countByReadFalse();

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.read = false OR n.read IS NULL")
    void markAllAsRead();

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.read = true")
    void deleteReadNotifications();
}
