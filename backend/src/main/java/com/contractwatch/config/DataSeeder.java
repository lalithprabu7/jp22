package com.contractwatch.config;

import com.contractwatch.entity.*;
import com.contractwatch.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Seeds realistic demo data for ContractWatch.
 *
 * Seeds: 8 vendors, 15 contracts across all statuses, renewal decisions, notifications.
 * Data is designed to make the dashboard visually interesting and demonstrate all features.
 *
 * Only runs if the database is empty (idempotent).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final VendorRepository vendorRepository;
    private final ContractRepository contractRepository;
    private final RenewalDecisionRepository renewalDecisionRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public void run(String... args) {
        if (vendorRepository.count() > 0) {
            log.info("[DataSeeder] Database already seeded. Skipping.");
            return;
        }

        log.info("[DataSeeder] Seeding demo data...");
        seedVendorsAndContracts();
        log.info("[DataSeeder] Demo data seeded successfully.");
    }

    private void seedVendorsAndContracts() {
        LocalDate today = LocalDate.now();

        // ─── VENDORS ─────────────────────────────────────────────────────────────

        Vendor aws = Vendor.builder()
            .name("Amazon Web Services").contactPerson("John Smith")
            .email("billing@aws.amazon.com").phone("+1-800-792-9073")
            .companyAddress("410 Terry Avenue North, Seattle, WA 98109, USA").build();

        Vendor microsoft = Vendor.builder()
            .name("Microsoft Corporation").contactPerson("Sarah Johnson")
            .email("contracts@microsoft.com").phone("+1-800-642-7676")
            .companyAddress("One Microsoft Way, Redmond, WA 98052, USA").build();

        Vendor google = Vendor.builder()
            .name("Google Cloud Platform").contactPerson("Rahul Mehta")
            .email("cloud-sales@google.com").phone("+1-844-613-7589")
            .companyAddress("1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA").build();

        Vendor zoho = Vendor.builder()
            .name("Zoho Corporation").contactPerson("Priya Sharma")
            .email("sales@zoho.com").phone("+91-44-67447000")
            .companyAddress("Estancia IT Park, Chennai, Tamil Nadu 600119, India").build();

        Vendor tcs = Vendor.builder()
            .name("Tata Consultancy Services").contactPerson("Vikram Nair")
            .email("contracts@tcs.com").phone("+91-22-67789999")
            .companyAddress("TCS House, Raveline Street, Mumbai 400001, India").build();

        Vendor infosys = Vendor.builder()
            .name("Infosys Limited").contactPerson("Ananya Krishnan")
            .email("vendor@infosys.com").phone("+91-80-28520261")
            .companyAddress("Hosur Road, Electronic City, Bengaluru 560100, India").build();

        Vendor netconnect = Vendor.builder()
            .name("NetConnect ISP").contactPerson("Arun Kumar")
            .email("corporate@netconnect.in").phone("+91-98-45612345")
            .companyAddress("12 Tech Park, Sector 5, Hyderabad 500081, India").build();

        Vendor officeSupply = Vendor.builder()
            .name("OfficePro Equipment Pvt Ltd").contactPerson("Deepa Rao")
            .email("accounts@officepro.com").phone("+91-80-45678901")
            .companyAddress("45 Industrial Area, Whitefield, Bengaluru 560066, India").build();

        vendorRepository.saveAll(List.of(aws, microsoft, google, zoho, tcs, infosys, netconnect, officeSupply));

        // ─── CONTRACTS ────────────────────────────────────────────────────────────

        // 1. RENEWAL_DUE — expiring in ~15 days, review already started
        Contract c1 = buildContract("CW-2026-001", "AWS Cloud Infrastructure Agreement",
            "Primary cloud hosting and compute services including EC2, S3, RDS.",
            aws, today.minusMonths(11), today.plusDays(15), 30,
            ContractStatus.RENEWAL_DUE, null, null);

        // 2. RENEWAL_DUE — expiring in ~8 days
        Contract c2 = buildContract("CW-2026-002", "Microsoft 365 Enterprise License",
            "Enterprise productivity suite for 500 users including Teams, SharePoint.",
            microsoft, today.minusMonths(10), today.plusDays(8), 30,
            ContractStatus.RENEWAL_DUE, null, null);

        // 3. ACTIVE — expiring in 45 days (outside notice window)
        Contract c3 = buildContract("CW-2026-003", "Google Cloud Platform Services",
            "BigQuery, Kubernetes Engine, and Cloud Storage services.",
            google, today.minusMonths(6), today.plusDays(45), 20,
            ContractStatus.ACTIVE, null, null);

        // 4. ACTIVE — expiring in 90 days
        Contract c4 = buildContract("CW-2026-004", "Zoho CRM Professional",
            "CRM platform subscription for sales team (100 users).",
            zoho, today.minusMonths(3), today.plusDays(90), 30,
            ContractStatus.ACTIVE, null, null);

        // 5. ACTIVE — long term, expiring in 6 months
        Contract c5 = buildContract("CW-2026-005", "TCS Application Support",
            "Application maintenance and support services for core banking system.",
            tcs, today.minusYears(1), today.plusMonths(6), 60,
            ContractStatus.ACTIVE, null, null);

        // 6. ACTIVE — expiring in 28 days (entering notice window soon)
        Contract c6 = buildContract("CW-2026-006", "Infosys IT Consulting",
            "Digital transformation consulting and implementation services.",
            infosys, today.minusMonths(9), today.plusDays(28), 30,
            ContractStatus.RENEWAL_DUE, null, null);

        // 7. ACTIVE — internet services
        Contract c7 = buildContract("CW-2026-007", "Office Internet Broadband",
            "1 Gbps dedicated internet connection for headquarters.",
            netconnect, today.minusMonths(2), today.plusDays(120), 14,
            ContractStatus.ACTIVE, null, null);

        // 8. ACTIVE — office equipment
        Contract c8 = buildContract("CW-2026-008", "Office Equipment Annual Maintenance",
            "Annual maintenance contract for printers, scanners, and copiers.",
            officeSupply, today.minusMonths(1), today.plusMonths(11), 30,
            ContractStatus.ACTIVE, null, null);

        // 9. RENEWED — shows renewal history
        Contract c9 = buildContract("CW-2025-009", "AWS Data Transfer Agreement",
            "High-volume data transfer and CDN services.",
            aws, today.minusMonths(18), today.plusMonths(6), 30,
            ContractStatus.RENEWED, "https://drive.google.com/aws-dt-agreement.pdf", "AWS DT Agreement.pdf");

        // 10. RENEWED — Microsoft Azure
        Contract c10 = buildContract("CW-2025-010", "Microsoft Azure DevOps",
            "Azure DevOps pipelines, repos, and board services.",
            microsoft, today.minusMonths(24), today.plusMonths(3), 30,
            ContractStatus.RENEWED, null, null);

        // 11. TERMINATED
        Contract c11 = buildContract("CW-2025-011", "Old CRM Platform",
            "Legacy CRM platform — terminated and replaced with Zoho CRM.",
            zoho, today.minusYears(2), today.minusMonths(2), 30,
            ContractStatus.TERMINATED, null, null);

        // 12. TERMINATED
        Contract c12 = buildContract("CW-2024-012", "TCS Legacy Support",
            "Legacy system support — terminated after migration.",
            tcs, today.minusYears(3), today.minusMonths(6), 45,
            ContractStatus.TERMINATED, null, null);

        // 13. EXPIRED — should have been renewed
        Contract c13 = buildContract("CW-2024-013", "Infosys Cloud Migration",
            "One-time cloud migration project — expired.",
            infosys, today.minusYears(2), today.minusDays(45), 30,
            ContractStatus.EXPIRED, null, null);

        // 14. ACTIVE — expiring in 22 days, within 30-day window
        Contract c14 = buildContract("CW-2026-014", "NetConnect Backup Connectivity",
            "Backup internet link for business continuity.",
            netconnect, today.minusMonths(10), today.plusDays(22), 30,
            ContractStatus.RENEWAL_DUE, null, null);

        // 15. ACTIVE — healthy, 5 months away
        Contract c15 = buildContract("CW-2026-015", "OfficePro Furniture Lease",
            "Annual furniture and fixture lease for new office floor.",
            officeSupply, today.minusMonths(7), today.plusMonths(5), 30,
            ContractStatus.ACTIVE, null, null);

        List<Contract> contracts = contractRepository.saveAll(
            List.of(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15)
        );

        // ─── RENEWAL DECISIONS ───────────────────────────────────────────────────

        // Decision for c9 (RENEWED)
        renewalDecisionRepository.save(RenewalDecision.builder()
            .contract(contracts.get(8)) // c9
            .decision(RenewalDecisionType.RENEWED)
            .decisionDate(today.minusMonths(6))
            .newEndDate(today.plusMonths(6))
            .remarks("Renewed for additional 12 months with 5% cost reduction.")
            .build());

        // Decision for c10 (RENEWED)
        renewalDecisionRepository.save(RenewalDecision.builder()
            .contract(contracts.get(9)) // c10
            .decision(RenewalDecisionType.RENEWED)
            .decisionDate(today.minusMonths(3))
            .newEndDate(today.plusMonths(3))
            .remarks("Auto-renewed per agreement. Pricing unchanged.")
            .build());

        // Decision for c11 (TERMINATED)
        renewalDecisionRepository.save(RenewalDecision.builder()
            .contract(contracts.get(10)) // c11
            .decision(RenewalDecisionType.TERMINATED)
            .decisionDate(today.minusMonths(2))
            .remarks("Replaced by Zoho CRM Professional (CW-2026-004). Vendor notified.")
            .build());

        // Decision for c12 (TERMINATED)
        renewalDecisionRepository.save(RenewalDecision.builder()
            .contract(contracts.get(11)) // c12
            .decision(RenewalDecisionType.TERMINATED)
            .decisionDate(today.minusMonths(6))
            .remarks("Legacy system decommissioned. TCS contract not renewed.")
            .build());

        // ─── NOTIFICATIONS ───────────────────────────────────────────────────────

        notificationRepository.save(Notification.builder()
            .contract(contracts.get(0)) // c1
            .type(NotificationType.RENEWAL_DUE)
            .message("Renewal review is due for 'AWS Cloud Infrastructure Agreement'. Contract expires in 15 days.")
            .read(false).build());

        notificationRepository.save(Notification.builder()
            .contract(contracts.get(1)) // c2
            .type(NotificationType.RENEWAL_DUE)
            .message("URGENT: 'Microsoft 365 Enterprise License' expires in 8 days. Immediate action required.")
            .read(false).build());

        notificationRepository.save(Notification.builder()
            .contract(contracts.get(5)) // c6
            .type(NotificationType.RENEWAL_DUE)
            .message("'Infosys IT Consulting' has entered the renewal window. 28 days remaining.")
            .read(false).build());

        notificationRepository.save(Notification.builder()
            .contract(contracts.get(13)) // c14
            .type(NotificationType.RENEWAL_DUE)
            .message("'NetConnect Backup Connectivity' enters renewal window. 22 days to contract end.")
            .read(false).build());

        notificationRepository.save(Notification.builder()
            .contract(contracts.get(8)) // c9
            .type(NotificationType.STATUS_CHANGED)
            .message("'AWS Data Transfer Agreement' has been successfully renewed for 12 months.")
            .read(true).build());

        notificationRepository.save(Notification.builder()
            .contract(contracts.get(10)) // c11
            .type(NotificationType.STATUS_CHANGED)
            .message("'Old CRM Platform' contract has been terminated and replaced by Zoho CRM.")
            .read(true).build());

        notificationRepository.save(Notification.builder()
            .contract(contracts.get(12)) // c13
            .type(NotificationType.CONTRACT_EXPIRED)
            .message("'Infosys Cloud Migration' has expired without renewal.")
            .read(true).build());
    }

    private Contract buildContract(
            String number, String title, String description,
            Vendor vendor, LocalDate start, LocalDate end,
            int noticeDays, ContractStatus status,
            String docRef, String docName) {

        LocalDate reviewDate = end.minusDays(noticeDays);
        return Contract.builder()
                .contractNumber(number)
                .title(title)
                .description(description)
                .vendor(vendor)
                .startDate(start)
                .endDate(end)
                .renewalNoticeDays(noticeDays)
                .renewalReviewDate(reviewDate)
                .status(status)
                .documentReference(docRef)
                .documentName(docName)
                .build();
    }
}
