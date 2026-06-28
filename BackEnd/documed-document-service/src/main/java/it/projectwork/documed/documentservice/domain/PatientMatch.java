package it.projectwork.documed.documentservice.domain;

import java.util.List;

/**
 * Result of the lightweight identity check available without a patient lookup.
 */
public class PatientMatch {

    private String status;
    private double score;
    private String extractedName;
    private String extractedFiscalCode;
    private List<Long> candidates;

    public PatientMatch() {
    }

    public PatientMatch(String status, double score, String extractedName,
            String extractedFiscalCode, List<Long> candidates) {
        this.status = status;
        this.score = score;
        this.extractedName = extractedName;
        this.extractedFiscalCode = extractedFiscalCode;
        this.candidates = candidates;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public String getExtractedName() {
        return extractedName;
    }

    public void setExtractedName(String extractedName) {
        this.extractedName = extractedName;
    }

    public String getExtractedFiscalCode() {
        return extractedFiscalCode;
    }

    public void setExtractedFiscalCode(String extractedFiscalCode) {
        this.extractedFiscalCode = extractedFiscalCode;
    }

    public List<Long> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<Long> candidates) {
        this.candidates = candidates;
    }
}
