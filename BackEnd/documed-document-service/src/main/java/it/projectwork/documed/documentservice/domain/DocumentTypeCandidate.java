package it.projectwork.documed.documentservice.domain;

/**
 * Candidate document type produced by the lightweight OCR classification rules.
 */
public class DocumentTypeCandidate {

    private DocumentType type;
    private double confidence;

    public DocumentTypeCandidate() {
    }

    public DocumentTypeCandidate(DocumentType type, double confidence) {
        this.type = type;
        this.confidence = confidence;
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
}
