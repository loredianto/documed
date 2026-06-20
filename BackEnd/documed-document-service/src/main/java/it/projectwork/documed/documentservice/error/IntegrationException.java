package it.projectwork.documed.documentservice.error;

/**
 * Reports an unavailable or invalid response from another Documed service.
 */
public class IntegrationException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final String code;

    public IntegrationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public IntegrationException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
