package it.projectwork.documed.documentservice.service;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import it.projectwork.documed.documentservice.client.OcrClientResponse;
import it.projectwork.documed.documentservice.client.OcrServiceClient;
import it.projectwork.documed.documentservice.domain.OcrStatus;
import it.projectwork.documed.documentservice.domain.PatientDocument;
import it.projectwork.documed.documentservice.dto.DocumentOcrResponse;
import it.projectwork.documed.documentservice.error.BusinessRuleException;
import it.projectwork.documed.documentservice.error.IntegrationException;
import it.projectwork.documed.documentservice.error.ResourceNotFoundException;
import it.projectwork.documed.documentservice.repository.PatientDocumentRepository;

/**
 * Implements the synchronous OCR state transitions for stored documents.
 */
@Service
public class DocumentOcrService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentOcrService.class);
    private static final int MAX_ERROR_MESSAGE_LENGTH = 500;

    private final PatientDocumentRepository documentRepository;
    private final GridFsStorageService gridFsStorageService;
    private final OcrServiceClient ocrServiceClient;

    public DocumentOcrService(PatientDocumentRepository documentRepository,
            GridFsStorageService gridFsStorageService,
            OcrServiceClient ocrServiceClient) {
        this.documentRepository = documentRepository;
        this.gridFsStorageService = gridFsStorageService;
        this.ocrServiceClient = ocrServiceClient;
    }

    /**
     * Reprocesses PENDING, FAILED or COMPLETED documents. PROCESSING prevents a
     * second simultaneous request from intentionally starting another run.
     */
    public DocumentOcrResponse process(String documentId, String authorizationHeader) {
        PatientDocument document = findEntity(documentId);
        if (document.getOcrStatus() == OcrStatus.PROCESSING) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT,
                    "OCR_ALREADY_PROCESSING",
                    "Il documento è già in elaborazione OCR");
        }

        document.setOcrStatus(OcrStatus.PROCESSING);
        document.setExtractedText(null);
        document.setOcrErrorMessage(null);
        document.setProcessedAt(null);
        document = documentRepository.save(document);
        LOGGER.info("OCR requested: documentId={}, admissionId={}",
                document.getId(), document.getAdmissionId());

        try {
            byte[] content = gridFsStorageService.load(document.getGridFsFileId());
            OcrClientResponse result = ocrServiceClient.extract(
                    content,
                    document.getOriginalFilename(),
                    document.getContentType(),
                    authorizationHeader);

            document.setExtractedText(result.getText().trim());
            document.setOcrErrorMessage(null);
            document.setProcessedAt(Instant.now());
            document.setOcrStatus(OcrStatus.COMPLETED);
            PatientDocument completed = documentRepository.save(document);
            LOGGER.info("OCR completed: documentId={}, processingTimeMs={}, language={}",
                    documentId, result.getProcessingTimeMs(), result.getLanguage());
            return toResponse(completed);
        } catch (RuntimeException processingException) {
            document.setExtractedText(null);
            document.setOcrStatus(OcrStatus.FAILED);
            document.setProcessedAt(Instant.now());
            document.setOcrErrorMessage(syntheticErrorMessage(processingException));
            try {
                documentRepository.save(document);
            } catch (RuntimeException metadataException) {
                processingException.addSuppressed(metadataException);
                LOGGER.error("Unable to persist FAILED OCR state: documentId={}",
                        documentId, metadataException);
            }
            LOGGER.warn("OCR failed: documentId={}, errorType={}",
                    documentId, processingException.getClass().getSimpleName());
            throw processingException;
        }
    }

    public DocumentOcrResponse findResult(String documentId) {
        return toResponse(findEntity(documentId));
    }

    private PatientDocument findEntity(String documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "DOCUMENT_NOT_FOUND", "Documento non trovato"));
    }

    private String syntheticErrorMessage(RuntimeException exception) {
        String message;
        if (exception instanceof BusinessRuleException
                || exception instanceof IntegrationException
                || exception instanceof ResourceNotFoundException) {
            message = exception.getMessage();
        } else {
            message = "Elaborazione OCR non riuscita";
        }
        if (message == null || message.trim().isEmpty()) {
            message = "Elaborazione OCR non riuscita";
        }
        message = message.replaceAll("[\\r\\n\\t]+", " ").trim();
        return message.length() > MAX_ERROR_MESSAGE_LENGTH
                ? message.substring(0, MAX_ERROR_MESSAGE_LENGTH)
                : message;
    }

    private DocumentOcrResponse toResponse(PatientDocument document) {
        return new DocumentOcrResponse(
                document.getId(),
                document.getOcrStatus(),
                document.getExtractedText(),
                document.getOcrErrorMessage(),
                document.getProcessedAt());
    }
}
