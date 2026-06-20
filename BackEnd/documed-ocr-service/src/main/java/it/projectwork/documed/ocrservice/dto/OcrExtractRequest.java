package it.projectwork.documed.ocrservice.dto;

import javax.validation.constraints.NotNull;

import org.springframework.web.multipart.MultipartFile;

/**
 * Multipart request accepted by the internal OCR endpoint.
 */
public class OcrExtractRequest {

    @NotNull(message = "Il file è obbligatorio")
    private MultipartFile file;

    public MultipartFile getFile() {
        return file;
    }

    public void setFile(MultipartFile file) {
        this.file = file;
    }
}
