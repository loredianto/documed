package it.projectwork.documed.documentservice.dto;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import org.springframework.web.multipart.MultipartFile;

import it.projectwork.documed.documentservice.domain.DocumentType;

/**
 * Multipart fields accepted when a document is uploaded.
 */
public class DocumentUploadRequest {

    @NotNull(message = "Il file è obbligatorio")
    private MultipartFile file;

    @NotNull(message = "La tipologia documentale è obbligatoria")
    private DocumentType documentType;

    @Size(max = 500, message = "La descrizione può contenere al massimo 500 caratteri")
    private String description;

    public MultipartFile getFile() {
        return file;
    }

    public void setFile(MultipartFile file) {
        this.file = file;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
