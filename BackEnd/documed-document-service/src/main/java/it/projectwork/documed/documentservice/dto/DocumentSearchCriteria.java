package it.projectwork.documed.documentservice.dto;

import javax.validation.constraints.Size;

import it.projectwork.documed.documentservice.domain.DocumentType;
import it.projectwork.documed.documentservice.domain.OcrStatus;

/**
 * Optional filters supported by document search.
 */
public class DocumentSearchCriteria {

    @Size(max = 200, message = "Il testo di ricerca può contenere al massimo 200 caratteri")
    private String query;

    private Long patientId;
    private Long admissionId;
    private DocumentType documentType;
    private OcrStatus ocrStatus;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
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

    public OcrStatus getOcrStatus() {
        return ocrStatus;
    }

    public void setOcrStatus(OcrStatus ocrStatus) {
        this.ocrStatus = ocrStatus;
    }
}
