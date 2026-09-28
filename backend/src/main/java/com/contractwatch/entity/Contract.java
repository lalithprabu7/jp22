package com.contractwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contracts", indexes = {
    @Index(name = "idx_contracts_end_date", columnList = "end_date"),
    @Index(name = "idx_contracts_status", columnList = "status"),
    @Index(name = "idx_contracts_renewal_review_date", columnList = "renewal_review_date"),
    @Index(name = "idx_contracts_vendor_id", columnList = "vendor_id"),
    @Index(name = "idx_contracts_contract_number", columnList = "contract_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_number", nullable = false, unique = true, length = 100)
    private String contractNumber;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "renewal_notice_days", nullable = false)
    private Integer renewalNoticeDays;

    @Column(name = "renewal_review_date")
    private LocalDate renewalReviewDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContractStatus status = ContractStatus.ACTIVE;

    @Column(name = "contract_value", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal contractValue = BigDecimal.ZERO;

    @Column(length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "payment_frequency", length = 30)
    @Builder.Default
    private String paymentFrequency = "ANNUALLY";

    @Column(name = "document_reference", length = 500)
    private String documentReference;

    @Column(name = "document_name", length = 200)
    private String documentName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RenewalDecision> renewalDecisions = new ArrayList<>();

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Notification> notifications = new ArrayList<>();

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Document> documents = new ArrayList<>();

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AuditEvent> auditEvents = new ArrayList<>();
}
