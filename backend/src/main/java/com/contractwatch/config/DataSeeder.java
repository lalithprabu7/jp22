package com.contractwatch.config;

import com.contractwatch.entity.Contract;
import com.contractwatch.entity.ContractStatus;
import com.contractwatch.entity.User;
import com.contractwatch.entity.UserRole;
import com.contractwatch.entity.Vendor;
import com.contractwatch.repository.ContractRepository;
import com.contractwatch.repository.UserRepository;
import com.contractwatch.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final ContractRepository contractRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("[DataSeeder] Ensuring admin user...");
        User admin = userRepository.findByEmailIgnoreCase("admin@contractwatch.com").orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .name("Lalith")
                    .email("admin@contractwatch.com")
                    .role(UserRole.ADMIN)
                    .password(passwordEncoder.encode("password"))
                    .build();
            userRepository.save(admin);
        }

        if (contractRepository.count() == 0) {
            System.out.println("[DataSeeder] Seeding mock data for dashboard...");

            // Create Vendors
            Vendor aws = vendorRepository.save(Vendor.builder().name("AWS Cloud").build());
            Vendor ms = vendorRepository.save(Vendor.builder().name("Microsoft Corporation").build());
            Vendor google = vendorRepository.save(Vendor.builder().name("Google Cloud").build());
            Vendor zoho = vendorRepository.save(Vendor.builder().name("Zoho Corporation").build());
            Vendor sf = vendorRepository.save(Vendor.builder().name("Salesforce").build());

            LocalDate today = LocalDate.now();

            // The 4 Specific Critical Contracts for the Chart
            createContract("AWS Cloud Compute", "CW-2024-001", aws, today.plusDays(7), new BigDecimal("120000"), ContractStatus.RENEWAL_DUE);
            createContract("Microsoft 365 E5", "CW-2024-002", ms, today.plusDays(14), new BigDecimal("85000"), ContractStatus.RENEWAL_DUE);
            createContract("Google BigQuery Engine", "CW-2024-003", google, today.plusDays(21), new BigDecimal("45000"), ContractStatus.RENEWAL_DUE);
            createContract("Zoho One Enterprise", "CW-2024-004", zoho, today.plusDays(28), new BigDecimal("15000"), ContractStatus.RENEWAL_DUE);

            // Active Contracts
            createContract("Salesforce CRM", "CW-2024-005", sf, today.plusDays(120), new BigDecimal("95000"), ContractStatus.ACTIVE);
            createContract("AWS S3 Storage", "CW-2024-006", aws, today.plusDays(180), new BigDecimal("45000"), ContractStatus.ACTIVE);
            createContract("Google Workspace", "CW-2024-007", google, today.plusDays(90), new BigDecimal("25000"), ContractStatus.ACTIVE);
            createContract("Azure DevOps", "CW-2024-008", ms, today.plusDays(150), new BigDecimal("35000"), ContractStatus.ACTIVE);

            // Renewed
            createContract("AWS RDS Clusters", "CW-2023-009", aws, today.minusDays(10), new BigDecimal("55000"), ContractStatus.RENEWED);
            createContract("Salesforce Marketing", "CW-2023-010", sf, today.minusDays(25), new BigDecimal("42000"), ContractStatus.RENEWED);

            // Terminated
            createContract("Legacy Zoho CRM", "CW-2022-011", zoho, today.minusDays(200), new BigDecimal("12000"), ContractStatus.TERMINATED);

            // Expired
            createContract("Legacy Google Analytics", "CW-2023-012", google, today.minusDays(15), new BigDecimal("5000"), ContractStatus.EXPIRED);

            System.out.println("[DataSeeder] 12 Contracts seeded successfully.");
        }
    }

    private void createContract(String title, String number, Vendor vendor, LocalDate endDate, BigDecimal value, ContractStatus status) {
        Contract c = Contract.builder()
                .title(title)
                .contractNumber(number)
                .vendor(vendor)
                .startDate(endDate.minusYears(1))
                .endDate(endDate)
                .renewalNoticeDays(30)
                .renewalReviewDate(endDate.minusDays(30))
                .contractValue(value)
                .status(status)
                .description("Mock data description for " + title)
                .build();
        contractRepository.save(c);
    }
}
