package it.projectwork.documed.documentservice.client;

/**
 * Successful response returned by the internal OCR Service.
 */
public class OcrClientResponse {

    private String text;
    private String language;
    private long processingTimeMs;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public long getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }
}
