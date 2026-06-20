package it.projectwork.documed.documentservice.dto;

import java.time.Instant;

import it.projectwork.documed.documentservice.domain.OcrStatus;

/**
 * Current OCR result and lifecycle state for one document.
 */
public class DocumentOcrResponse {

    private final String documentId;
    private final OcrStatus ocrStatus;
    private final String extractedText;
    private final String ocrErrorMessage;
    private final Instant processedAt;

    public DocumentOcrResponse(String documentId, OcrStatus ocrStatus,
            String extractedText, String ocrErrorMessage, Instant processedAt) {
        this.documentId = documentId;
        this.ocrStatus = ocrStatus;
        this.extractedText = extractedText;
        this.ocrErrorMessage = ocrErrorMessage;
        this.processedAt = processedAt;
    }

    public String getDocumentId() {
        return documentId;
    }

    public OcrStatus getOcrStatus() {
        return ocrStatus;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public String getOcrErrorMessage() {
        return ocrErrorMessage;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }
}
