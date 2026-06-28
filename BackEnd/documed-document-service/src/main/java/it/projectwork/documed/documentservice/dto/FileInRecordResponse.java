package it.projectwork.documed.documentservice.dto;

/**
 * Response returned after archiving a digital document in the admission record.
 */
public class FileInRecordResponse {

    private final String documentId;
    private final boolean filed;

    public FileInRecordResponse(String documentId, boolean filed) {
        this.documentId = documentId;
        this.filed = filed;
    }

    public String getDocumentId() {
        return documentId;
    }

    public boolean isFiled() {
        return filed;
    }
}
