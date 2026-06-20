package it.projectwork.documed.documentservice.error;

/**
 * Wraps an unexpected GridFS or binary input/output failure.
 */
public class DocumentStorageException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final String code;

    public DocumentStorageException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
