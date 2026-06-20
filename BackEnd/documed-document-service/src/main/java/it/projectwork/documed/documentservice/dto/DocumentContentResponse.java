package it.projectwork.documed.documentservice.dto;

/**
 * Binary content plus safe response headers reconstructed from metadata.
 */
public class DocumentContentResponse {

    private final byte[] content;
    private final String originalFilename;
    private final String contentType;

    public DocumentContentResponse(byte[] content, String originalFilename, String contentType) {
        this.content = content;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
    }

    public byte[] getContent() {
        return content;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public String getContentType() {
        return contentType;
    }
}
