package com.contractwatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents", indexes = {
    @Index(name = "idx_documents_contract_id", columnList = "contract_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DocumentType type = DocumentType.CONTRACT;

    @Column(length = 20)
    @Builder.Default
    private String version = "1.0";

    @Column(nullable = false, length = 500)
    private String reference;

    @Column(name = "uploaded_by", length = 100)
    @Builder.Default
    private String uploadedBy = "Admin";

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(columnDefinition = "TEXT")
    private String description;
}
