package it.projectwork.documed.documentservice.dto;

import java.time.Instant;

import it.projectwork.documed.documentservice.domain.OcrStatus;
import it.projectwork.documed.documentservice.domain.OcrExtraction;

/**
 * Current OCR result and lifecycle state for one document.
 */
public class DocumentOcrResponse {

    private final String documentId;
    private final OcrStatus ocrStatus;
    private final String extractedText;
    private final OcrExtraction ocrExtraction;
    private final String ocrErrorMessage;
    private final Instant processedAt;

    public DocumentOcrResponse(String documentId, OcrStatus ocrStatus,
            String extractedText, OcrExtraction ocrExtraction,
            String ocrErrorMessage, Instant processedAt) {
        this.documentId = documentId;
        this.ocrStatus = ocrStatus;
        this.extractedText = extractedText;
        this.ocrExtraction = ocrExtraction;
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

    public OcrExtraction getOcrExtraction() {
        return ocrExtraction;
    }

    /**
     * Backward-compatible alias for documentation that calls the structured
     * block "extraction"; the frontend reads "ocrExtraction".
     */
    public OcrExtraction getExtraction() {
        return ocrExtraction;
    }

    public String getOcrErrorMessage() {
        return ocrErrorMessage;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }
}
