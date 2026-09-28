package com.contractwatch.scheduler;

import com.contractwatch.service.ContractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Scheduled reminder system.
 *
 * Runs daily at 08:00 AM to:
 * 1. Detect contracts entering the renewal notice window → mark RENEWAL_DUE
 * 2. Detect contracts past end date → mark EXPIRED
 * 3. Generate notifications (de-duplicated per day)
 *
 * Structured for easy future email/Slack integration via NotificationService.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final ContractService contractService;

    @Scheduled(cron = "0 0 8 * * *")
    public void runDailyRenewalCheck() {
        log.info("=== [ContractWatch Scheduler] Starting daily renewal check at {} ===", LocalDateTime.now());
        try {
            contractService.checkAndUpdateStatuses();
            log.info("=== [ContractWatch Scheduler] Daily renewal check completed successfully ===");
        } catch (Exception e) {
            log.error("=== [ContractWatch Scheduler] Error during daily renewal check: {} ===", e.getMessage(), e);
        }
    }

    /**
     * Runs every minute in DEV mode for quick demo/testing.
     * Comment out this method and use runDailyRenewalCheck in production.
     * 
     * Uncomment to test immediately:
     * @Scheduled(fixedDelay = 60000)
     */
    // public void runDevCheck() { runDailyRenewalCheck(); }
}
