package it.projectwork.documed.documentservice.dto;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import it.projectwork.documed.documentservice.domain.DocumentType;
import it.projectwork.documed.documentservice.domain.OcrExtraction;

/**
 * Manual confirmation of the digital document produced by OCR.
 */
public class DocumentOcrConfirmationRequest {

    @NotNull
    private DocumentType documentType;

    @Valid
    @NotNull
    private OcrExtraction ocrExtraction;

    public DocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    public OcrExtraction getOcrExtraction() {
        return ocrExtraction;
    }

    public void setOcrExtraction(OcrExtraction ocrExtraction) {
        this.ocrExtraction = ocrExtraction;
    }
}
