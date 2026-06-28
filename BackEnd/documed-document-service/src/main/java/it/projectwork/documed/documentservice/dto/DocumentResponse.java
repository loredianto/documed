package it.projectwork.documed.documentservice.dto;

import java.time.Instant;

import it.projectwork.documed.documentservice.domain.DocumentType;
import it.projectwork.documed.documentservice.domain.OcrStatus;
import it.projectwork.documed.documentservice.domain.OcrExtraction;

/**
 * Metadata returned to API consumers without exposing GridFS internals.
 */
public class DocumentResponse {

    private final String id;
    private final Long patientId;
    private final Long admissionId;
    private final DocumentType documentType;
    private final String originalFilename;
    private final String description;
    private final String contentType;
    private final long fileSize;
    private final OcrStatus ocrStatus;
    private final String extractedText;
    private final OcrExtraction ocrExtraction;
    private final String ocrErrorMessage;
    private final Instant uploadedAt;
    private final Instant processedAt;
    private final boolean filedInRecord;

    public DocumentResponse(String id, Long patientId, Long admissionId,
            DocumentType documentType, String originalFilename, String description,
            String contentType, long fileSize, OcrStatus ocrStatus,
            String extractedText, OcrExtraction ocrExtraction, String ocrErrorMessage,
            Instant uploadedAt, Instant processedAt, boolean filedInRecord) {
        this.id = id;
        this.patientId = patientId;
        this.admissionId = admissionId;
        this.documentType = documentType;
        this.originalFilename = originalFilename;
        this.description = description;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.ocrStatus = ocrStatus;
        this.extractedText = extractedText;
        this.ocrExtraction = ocrExtraction;
        this.ocrErrorMessage = ocrErrorMessage;
        this.uploadedAt = uploadedAt;
        this.processedAt = processedAt;
        this.filedInRecord = filedInRecord;
    }

    public String getId() {
        return id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public Long getAdmissionId() {
        return admissionId;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public String getDescription() {
        return description;
    }

    public String getContentType() {
        return contentType;
    }

    public long getFileSize() {
        return fileSize;
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

    public String getOcrErrorMessage() {
        return ocrErrorMessage;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public boolean isFiledInRecord() {
        return filedInRecord;
    }
}
