package it.projectwork.documed.documentservice.domain;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Metadata for a file stored separately in MongoDB GridFS.
 */
@Document(collection = "documents")
public class PatientDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String gridFsFileId;

    @Indexed
    private Long patientId;

    @Indexed
    private Long admissionId;

    @Indexed
    private DocumentType documentType;

    @TextIndexed
    private String originalFilename;

    @TextIndexed
    private String description;

    private String contentType;

    private long fileSize;

    @Indexed
    private OcrStatus ocrStatus;

    @TextIndexed
    private String extractedText;

    private OcrExtraction ocrExtraction;

    private String ocrErrorMessage;

    @Indexed
    private Instant uploadedAt;

    private Instant processedAt;

    private boolean filedInRecord;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getGridFsFileId() {
        return gridFsFileId;
    }

    public void setGridFsFileId(String gridFsFileId) {
        this.gridFsFileId = gridFsFileId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getAdmissionId() {
        return admissionId;
    }

    public void setAdmissionId(Long admissionId) {
        this.admissionId = admissionId;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public OcrStatus getOcrStatus() {
        return ocrStatus;
    }

    public void setOcrStatus(OcrStatus ocrStatus) {
        this.ocrStatus = ocrStatus;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public OcrExtraction getOcrExtraction() {
        return ocrExtraction;
    }

    public void setOcrExtraction(OcrExtraction ocrExtraction) {
        this.ocrExtraction = ocrExtraction;
    }

    public String getOcrErrorMessage() {
        return ocrErrorMessage;
    }

    public void setOcrErrorMessage(String ocrErrorMessage) {
        this.ocrErrorMessage = ocrErrorMessage;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }

    public boolean isFiledInRecord() {
        return filedInRecord;
    }

    public void setFiledInRecord(boolean filedInRecord) {
        this.filedInRecord = filedInRecord;
    }
}
