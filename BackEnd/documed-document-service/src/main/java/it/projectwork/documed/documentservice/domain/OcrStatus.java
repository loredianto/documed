package it.projectwork.documed.documentservice.domain;

/**
 * OCR lifecycle stored now and used by the future OCR Service integration.
 */
public enum OcrStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED
}
