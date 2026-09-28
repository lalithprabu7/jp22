package com.contractwatch.mapper;

import com.contractwatch.dto.DocumentDto;
import com.contractwatch.entity.Document;
import org.springframework.stereotype.Component;

@Component
public class DocumentMapper {

    public DocumentDto toDto(Document doc) {
        if (doc == null) return null;
        return new DocumentDto(
            doc.getId(),
            doc.getContract() != null ? doc.getContract().getId() : null,
            doc.getContract() != null ? doc.getContract().getTitle() : null,
            doc.getContract() != null ? doc.getContract().getContractNumber() : null,
            doc.getName(),
            doc.getType(),
            doc.getVersion(),
            doc.getReference(),
            doc.getUploadedBy(),
            doc.getUploadedAt(),
            doc.getDescription()
        );
    }
}
