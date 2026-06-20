package it.projectwork.documed.ocrservice.error;

import org.springframework.http.HttpStatus;

/**
 * Reports validation, process execution or unreadable-image failures.
 */
public class OcrProcessingException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final HttpStatus status;
    private final String code;

    public OcrProcessingException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public OcrProcessingException(HttpStatus status, String code, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
