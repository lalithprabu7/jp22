package com.contractwatch.config;

import com.contractwatch.entity.*;
import com.contractwatch.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final VendorRepository vendorRepository;
    private final ContractRepository contractRepository;
    private final RenewalDecisionRepository renewalDecisionRepository;
    private final NotificationRepository notificationRepository;
    private final DocumentRepository documentRepository;
    private final AuditEventRepository auditEventRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        if (vendorRepository.count() > 0) {
            log.info("[DataSeeder] Database already populated. Ensuring users exist.");
            seedUsersIfMissing();
            return;
        }

        log.info("[DataSeeder] Seeding comprehensive enterprise demo data...");
        seedUsersIfMissing();
        seedVendorsAndContracts();
        log.info("[DataSeeder] Enterprise demo data seeded successfully.");
    }

    private void seedUsersIfMissing() {
        if (userRepository.count() == 0) {
            userRepository.saveAll(List.of(
                User.builder().name("System Administrator").email("admin@contractwatch.com").password("admin123").role(UserRole.ADMIN).build(),
                User.builder().name("Procurement Manager").email("manager@contractwatch.com").password("manager123").role(UserRole.MANAGER).build(),
                User.builder().name("Financial Analyst").email("viewer@contractwatch.com").password("viewer123").role(UserRole.VIEWER).build()
            ));
        }
    }

    private void seedVendorsAndContracts() {
        LocalDate today = LocalDate.now();

        // ─── VENDORS ─────────────────────────────────────────────────────────────
        Vendor aws = Vendor.builder().name("Amazon Web Services").contactPerson("John Smith")
            .email("billing@aws.amazon.com").phone("+1-800-792-9073")
            .companyAddress("410 Terry Avenue North, Seattle, WA 98109, USA").build();

        Vendor microsoft = Vendor.builder().name("Microsoft Corporation").contactPerson("Sarah Johnson")
            .email("contracts@microsoft.com").phone("+1-800-642-7676")
            .companyAddress("One Microsoft Way, Redmond, WA 98052, USA").build();

        Vendor google = Vendor.builder().name("Google Cloud Platform").contactPerson("Rahul Mehta")
            .email("cloud-sales@google.com").phone("+1-844-613-7589")
            .companyAddress("1600 Amphitheatre Parkway, Mountain View, CA 94043, USA").build();

        Vendor zoho = Vendor.builder().name("Zoho Corporation").contactPerson("Priya Sharma")
            .email("enterprise@zohocorp.com").phone("+91-44-6744-7070")
            .companyAddress("Estancia IT Park, Guduvanchery, Chennai 603202, India").build();

        Vendor tcs = Vendor.builder().name("Tata Consultancy Services").contactPerson("Anand Iyer")
            .email("vendor-contracts@tcs.com").phone("+91-22-6778-9999")
            .companyAddress("TCS House, Raveline Street, Fort, Mumbai 400001, India").build();

        Vendor infosys = Vendor.builder().name("Infosys Limited").contactPerson("Deepak Nair")
            .email("contracts@infosys.com").phone("+91-80-2852-0261")
            .companyAddress("Electronics City, Hosur Road, Bengaluru 560100, India").build();

        Vendor officeEquip = Vendor.builder().name("Office Equipment Supplier Inc.").contactPerson("Robert Vance")
            .email("orders@vancerefrigeration.com").phone("+1-570-555-0145")
            .companyAddress("1725 Slough Avenue, Scranton, PA 18505, USA").build();

        Vendor isp = Vendor.builder().name("Airtel Enterprise ISP").contactPerson("Vikram Batra")
            .email("corporate@airtel.in").phone("+91-11-4266-6500")
            .companyAddress("Airtel Centre, Plot 16, Udyog Vihar Phase IV, Gurugram 122015, India").build();

        vendorRepository.saveAll(List.of(aws, microsoft, google, zoho, tcs, infosys, officeEquip, isp));

        // ─── CONTRACTS ───────────────────────────────────────────────────────────

        // 1. Critical Expiry: AWS (Expires in 8 days)
        Contract c1 = Contract.builder()
            .contractNumber("CW-2026-001")
            .title("AWS Cloud Infrastructure & Compute Agreement")
            .description("Core enterprise production infrastructure hosting US-East and AP-South clusters.")
            .vendor(aws)
            .startDate(today.minusDays(350))
            .endDate(today.plusDays(8))
            .renewalNoticeDays(30)
            .renewalReviewDate(today.plusDays(8).minusDays(30))
            .status(ContractStatus.RENEWAL_DUE)
            .contractValue(new BigDecimal("1250000.00"))
            .currency("INR")
            .paymentFrequency("ANNUALLY")
            .documentReference("https://drive.google.com/file/d/aws-enterprise-cloud-agreement.pdf")
            .documentName("AWS_Enterprise_MSA_2025.pdf")
            .build();

        // 2. Microsoft 365 E5 Suite (Expires in 15 days)
        Contract c2 = Contract.builder()
            .contractNumber("CW-2026-002")
            .title("Microsoft 365 E5 Enterprise Productivity Suite")
            .description("500 user seats covering Defender XDR, Teams Phone System, and Purview compliance.")
            .vendor(microsoft)
            .startDate(today.minusDays(340))
            .endDate(today.plusDays(15))
            .renewalNoticeDays(45)
            .renewalReviewDate(today.plusDays(15).minusDays(45))
            .status(ContractStatus.RENEWAL_DUE)
            .contractValue(new BigDecimal("820000.00"))
            .currency("INR")
            .paymentFrequency("ANNUALLY")
            .documentReference("https://drive.google.com/file/d/m365-e5-license-agreement.pdf")
            .documentName("Microsoft_E5_Agreement.pdf")
            .build();

        // 3. Google BigQuery Data Warehouse (Expires in 22 days)
        Contract c3 = Contract.builder()
            .contractNumber("CW-2026-003")
            .title("Google BigQuery Enterprise Analytics Cluster")
            .description("100TB query slot capacity with enterprise SLA support.")
            .vendor(google)
            .startDate(today.minusDays(180))
            .endDate(today.plusDays(22))
            .renewalNoticeDays(30)
            .renewalReviewDate(today.plusDays(22).minusDays(30))
            .status(ContractStatus.RENEWAL_DUE)
            .contractValue(new BigDecimal("450000.00"))
            .currency("INR")
            .paymentFrequency("MONTHLY")
            .documentReference("https://drive.google.com/file/d/gcp-bigquery-agreement.pdf")
            .documentName("GCP_BigQuery_Contract.pdf")
            .build();

        // 4. Zoho CRM & Creator (Expires in 28 days)
        Contract c4 = Contract.builder()
            .contractNumber("CW-2026-004")
            .title("Zoho One Enterprise CRM & Desk Solution")
            .description("Unified sales, support desk, and workflow automation subscription.")
            .vendor(zoho)
            .startDate(today.minusDays(300))
            .endDate(today.plusDays(28))
            .renewalNoticeDays(30)
            .renewalReviewDate(today.plusDays(28).minusDays(30))
            .status(ContractStatus.RENEWAL_DUE)
            .contractValue(new BigDecimal("340000.00"))
            .currency("INR")
            .paymentFrequency("ANNUALLY")
            .documentReference("https://drive.google.com/file/d/zoho-enterprise-sla.pdf")
            .documentName("Zoho_One_Contract_2025.pdf")
            .build();

        // 5. TCS DevOps & Cloud Transformation (Active, 140 days remaining)
        Contract c5 = Contract.builder()
            .contractNumber("CW-2026-005")
            .title("TCS Dedicated DevOps Support & Engineering Retainer")
            .description("8 senior cloud architects providing 24/7 SRE and migration support.")
            .vendor(tcs)
            .startDate(today.minusDays(120))
            .endDate(today.plusDays(140))
            .renewalNoticeDays(60)
            .renewalReviewDate(today.plusDays(140).minusDays(60))
            .status(ContractStatus.ACTIVE)
            .contractValue(new BigDecimal("2400000.00"))
            .currency("INR")
            .paymentFrequency("QUARTERLY")
            .documentReference("https://drive.google.com/file/d/tcs-devops-sow.pdf")
            .documentName("TCS_SOW_DevOps_2026.pdf")
            .build();

        // 6. Infosys ERP Maintenance (Active, 180 days remaining)
        Contract c6 = Contract.builder()
            .contractNumber("CW-2026-006")
            .title("Infosys SAP ERP S/4HANA Maintenance Services")
            .description("Functional consulting and database management for enterprise finance modules.")
            .vendor(infosys)
            .startDate(today.minusDays(90))
            .endDate(today.plusDays(180))
            .renewalNoticeDays(45)
            .renewalReviewDate(today.plusDays(180).minusDays(45))
            .status(ContractStatus.ACTIVE)
            .contractValue(new BigDecimal("1850000.00"))
            .currency("INR")
            .paymentFrequency("QUARTERLY")
            .documentReference("https://drive.google.com/file/d/infosys-erp-support.pdf")
            .documentName("Infosys_SAP_Agreement.pdf")
            .build();

        // 7. Airtel Dedicated Fiber Line (Active, 210 days remaining)
        Contract c7 = Contract.builder()
            .contractNumber("CW-2026-007")
            .title("Airtel 1Gbps Dedicated Dual-Loop Fiber Lease")
            .description("Primary and redundant redundant leased line with 99.99% uptime guarantee.")
            .vendor(isp)
            .startDate(today.minusDays(60))
            .endDate(today.plusDays(210))
            .renewalNoticeDays(30)
            .renewalReviewDate(today.plusDays(210).minusDays(30))
            .status(ContractStatus.ACTIVE)
            .contractValue(new BigDecimal("180000.00"))
            .currency("INR")
            .paymentFrequency("MONTHLY")
            .documentReference("https://drive.google.com/file/d/airtel-fiber-contract.pdf")
            .documentName("Airtel_Leased_Line_SLA.pdf")
            .build();

        // 8. Office Equipment Managed Print Services (Active, 290 days remaining)
        Contract c8 = Contract.builder()
            .contractNumber("CW-2026-008")
            .title("Xerox Multifunction Printer Lease & Toner Maintenance")
            .description("12 office multi-function printers with proactive supply replenishment.")
            .vendor(officeEquip)
            .startDate(today.minusDays(45))
            .endDate(today.plusDays(290))
            .renewalNoticeDays(30)
            .renewalReviewDate(today.plusDays(290).minusDays(30))
            .status(ContractStatus.ACTIVE)
            .contractValue(new BigDecimal("95000.00"))
            .currency("INR")
            .paymentFrequency("QUARTERLY")
            .documentReference("https://drive.google.com/file/d/xerox-lease-agreement.pdf")
            .documentName("Xerox_Printer_Lease.pdf")
            .build();

        // 9. RENEWED Contract: AWS Support Plan
        Contract c9 = Contract.builder()
            .contractNumber("CW-2025-009")
            .title("AWS Enterprise Tier 24/7 Technical Support Plan")
            .description("Dedicated Technical Account Manager (TAM) and 15-minute response SLA.")
            .vendor(aws)
            .startDate(today.minusDays(400))
            .endDate(today.plusDays(320))
            .renewalNoticeDays(30)
            .renewalReviewDate(today.plusDays(320).minusDays(30))
            .status(ContractStatus.RENEWED)
            .contractValue(new BigDecimal("600000.00"))
            .currency("INR")
            .paymentFrequency("ANNUALLY")
            .documentReference("https://drive.google.com/file/d/aws-enterprise-support-plan.pdf")
            .documentName("AWS_TAM_Support_2026.pdf")
            .build();

        // 10. RENEWED Contract: Microsoft Teams Rooms
        Contract c10 = Contract.builder()
            .contractNumber("CW-2025-010")
            .title("Microsoft Teams Rooms Pro Video Hardware Licenses")
            .description("Conference room licenses across 15 meeting spaces.")
            .vendor(microsoft)
            .startDate(today.minusDays(380))
            .endDate(today.plusDays(340))
            .renewalNoticeDays(30)
            .renewalReviewDate(today.plusDays(340).minusDays(30))
            .status(ContractStatus.RENEWED)
            .contractValue(new BigDecimal("210000.00"))
            .currency("INR")
            .paymentFrequency("ANNUALLY")
            .documentReference("https://drive.google.com/file/d/teams-rooms-licenses.pdf")
            .documentName("Teams_Rooms_Agreement.pdf")
            .build();

        // 11. TERMINATED Contract: Legacy Oracle Database Hosting
        Contract c11 = Contract.builder()
            .contractNumber("CW-2024-011")
            .title("Legacy On-Premise Database Appliance Maintenance")
            .description("Terminated following successful database migration to Google BigQuery and Cloud SQL.")
            .vendor(tcs)
            .startDate(today.minusDays(500))
            .endDate(today.minusDays(80))
            .renewalNoticeDays(30)
            .renewalReviewDate(today.minusDays(80).minusDays(30))
            .status(ContractStatus.TERMINATED)
            .contractValue(new BigDecimal("980000.00"))
            .currency("INR")
            .paymentFrequency("ANNUALLY")
            .documentReference("https://drive.google.com/file/d/legacy-db-termination.pdf")
            .documentName("Legacy_DB_Termination_Letter.pdf")
            .build();

        // 12. EXPIRED Contract: Security Penetration Testing Retainer
        Contract c12 = Contract.builder()
            .contractNumber("CW-2025-012")
            .title("Third-Party Annual Penetration Testing Retainer")
            .description("Annual vulnerability assessment and red-team retainer that expired without renewal.")
            .vendor(infosys)
            .startDate(today.minusDays(380))
            .endDate(today.minusDays(15))
            .renewalNoticeDays(14)
            .renewalReviewDate(today.minusDays(15).minusDays(14))
            .status(ContractStatus.EXPIRED)
            .contractValue(new BigDecimal("350000.00"))
            .currency("INR")
            .paymentFrequency("ANNUALLY")
            .documentReference("https://drive.google.com/file/d/pen-test-retainer.pdf")
            .documentName("PenTest_Engagement_2025.pdf")
            .build();

        List<Contract> contracts = List.of(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12);
        contractRepository.saveAll(contracts);

        // ─── DOCUMENTS ───────────────────────────────────────────────────────────
        for (Contract c : contracts) {
            Document doc1 = Document.builder()
                    .contract(c)
                    .name(c.getDocumentName() != null ? c.getDocumentName() : "Master_Agreement.pdf")
                    .type(DocumentType.CONTRACT)
                    .version("1.0")
                    .reference(c.getDocumentReference() != null ? c.getDocumentReference() : "https://documents.contractwatch.io/agreements/" + c.getContractNumber())
                    .uploadedBy("Procurement Lead")
                    .description("Executed agreement document")
                    .build();

            Document doc2 = Document.builder()
                    .contract(c)
                    .name("Service_Level_Agreement_v1.pdf")
                    .type(DocumentType.AGREEMENT)
                    .version("1.2")
                    .reference("https://documents.contractwatch.io/sla/" + c.getContractNumber())
                    .uploadedBy("Legal Team")
                    .description("Performance and availability SLAs with financial penalty clauses")
                    .build();

            documentRepository.saveAll(List.of(doc1, doc2));
        }

        // ─── AUDIT EVENTS ────────────────────────────────────────────────────────
        for (Contract c : contracts) {
            AuditEvent e1 = AuditEvent.builder()
                    .contract(c)
                    .eventType(AuditEventType.CONTRACT_CREATED)
                    .description("Contract registered into ContractWatch system")
                    .performedBy("System Admin")
                    .build();

            AuditEvent e2 = AuditEvent.builder()
                    .contract(c)
                    .eventType(AuditEventType.DOCUMENT_ADDED)
                    .description("Master Service Agreement attached")
                    .performedBy("Procurement Lead")
                    .build();

            auditEventRepository.saveAll(List.of(e1, e2));
        }

        // Audit events for decisions
        auditEventRepository.save(AuditEvent.builder()
                .contract(c9)
                .eventType(AuditEventType.CONTRACT_RENEWED)
                .description("Contract renewed until " + c9.getEndDate() + " with 10% negotiated enterprise volume rebate")
                .performedBy("Procurement Manager")
                .build());

        auditEventRepository.save(AuditEvent.builder()
                .contract(c11)
                .eventType(AuditEventType.CONTRACT_TERMINATED)
                .description("Contract terminated due to cloud database migration completion")
                .performedBy("Director of Infrastructure")
                .build());

        // ─── RENEWAL DECISIONS ───────────────────────────────────────────────────
        RenewalDecision rd1 = RenewalDecision.builder()
                .contract(c9)
                .decision(RenewalDecisionType.RENEWED)
                .decisionDate(today.minusDays(40))
                .newEndDate(c9.getEndDate())
                .remarks("Approved renewal with 10% negotiated enterprise volume rebate.")
                .build();

        RenewalDecision rd2 = RenewalDecision.builder()
                .contract(c10)
                .decision(RenewalDecisionType.RENEWED)
                .decisionDate(today.minusDays(20))
                .newEndDate(c10.getEndDate())
                .remarks("Renewed with updated video hardware bundle licenses.")
                .build();

        RenewalDecision rd3 = RenewalDecision.builder()
                .contract(c11)
                .decision(RenewalDecisionType.TERMINATED)
                .decisionDate(today.minusDays(80))
                .remarks("Contract terminated due to cloud database migration completion.")
                .build();

        renewalDecisionRepository.saveAll(List.of(rd1, rd2, rd3));

        // ─── NOTIFICATIONS ───────────────────────────────────────────────────────
        Notification n1 = Notification.builder()
                .contract(c1)
                .type(NotificationType.URGENT)
                .message("CRITICAL: Contract 'AWS Cloud Infrastructure' expires in 8 days! Immediate decision required.")
                .read(false)
                .build();

        Notification n2 = Notification.builder()
                .contract(c2)
                .type(NotificationType.RENEWAL_DUE)
                .message("Attention: 'Microsoft 365 E5 Suite' expires in 15 days. Notice deadline is active.")
                .read(false)
                .build();

        Notification n3 = Notification.builder()
                .contract(c3)
                .type(NotificationType.RENEWAL_DUE)
                .message("'Google BigQuery Enterprise' has entered its renewal review window.")
                .read(false)
                .build();

        Notification n4 = Notification.builder()
                .contract(c12)
                .type(NotificationType.CONTRACT_EXPIRED)
                .message("Notice: 'Penetration Testing Retainer' has expired without renewal.")
                .read(true)
                .build();

        Notification n5 = Notification.builder()
                .contract(c9)
                .type(NotificationType.STATUS_CHANGED)
                .message("Confirmation: 'AWS Technical Support Plan' successfully renewed.")
                .read(true)
                .build();

        notificationRepository.saveAll(List.of(n1, n2, n3, n4, n5));
    }
}
