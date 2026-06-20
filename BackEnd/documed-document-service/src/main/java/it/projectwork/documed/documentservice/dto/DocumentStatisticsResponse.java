package it.projectwork.documed.documentservice.dto;

import java.util.Map;

import it.projectwork.documed.documentservice.domain.DocumentType;
import it.projectwork.documed.documentservice.domain.OcrStatus;

/**
 * Document and OCR counters required by the administrative dashboard.
 */
public class DocumentStatisticsResponse {

    private final long totalDocuments;
    private final Map<DocumentType, Long> documentsByType;
    private final Map<OcrStatus, Long> documentsByOcrStatus;

    public DocumentStatisticsResponse(long totalDocuments,
            Map<DocumentType, Long> documentsByType,
            Map<OcrStatus, Long> documentsByOcrStatus) {
        this.totalDocuments = totalDocuments;
        this.documentsByType = documentsByType;
        this.documentsByOcrStatus = documentsByOcrStatus;
    }

    public long getTotalDocuments() {
        return totalDocuments;
    }

    public Map<DocumentType, Long> getDocumentsByType() {
        return documentsByType;
    }

    public Map<OcrStatus, Long> getDocumentsByOcrStatus() {
        return documentsByOcrStatus;
    }
}
