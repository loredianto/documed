package it.projectwork.documed.ocrservice.dto;

/**
 * Text and technical execution data returned after successful OCR.
 */
public class OcrExtractResponse {

    private final String text;
    private final String language;
    private final long processingTimeMs;

    public OcrExtractResponse(String text, String language, long processingTimeMs) {
        this.text = text;
        this.language = language;
        this.processingTimeMs = processingTimeMs;
    }

    public String getText() {
        return text;
    }

    public String getLanguage() {
        return language;
    }

    public long getProcessingTimeMs() {
        return processingTimeMs;
    }
}
