package it.projectwork.documed.documentservice.domain;

import java.util.List;

/**
 * Document type proposed from OCR text. The frontend can ask the operator to
 * confirm or correct this proposal.
 */
public class TypeClassification {

    private DocumentType type;
    private double confidence;
    private String status;
    private List<DocumentTypeCandidate> candidates;

    public TypeClassification() {
    }

    public TypeClassification(DocumentType type, double confidence, String status,
            List<DocumentTypeCandidate> candidates) {
        this.type = type;
        this.confidence = confidence;
        this.status = status;
        this.candidates = candidates;
    }

    public DocumentType getType() {
        return type;
    }

    public void setType(DocumentType type) {
        this.type = type;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<DocumentTypeCandidate> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<DocumentTypeCandidate> candidates) {
        this.candidates = candidates;
    }
}
