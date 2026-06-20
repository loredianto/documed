package it.projectwork.documed.documentservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import it.projectwork.documed.documentservice.client.OcrClientResponse;
import it.projectwork.documed.documentservice.client.OcrServiceClient;
import it.projectwork.documed.documentservice.domain.DocumentType;
import it.projectwork.documed.documentservice.domain.OcrStatus;
import it.projectwork.documed.documentservice.domain.PatientDocument;
import it.projectwork.documed.documentservice.dto.DocumentOcrResponse;
import it.projectwork.documed.documentservice.error.BusinessRuleException;
import it.projectwork.documed.documentservice.error.IntegrationException;
import it.projectwork.documed.documentservice.error.ResourceNotFoundException;
import it.projectwork.documed.documentservice.repository.PatientDocumentRepository;
import it.projectwork.documed.documentservice.service.DocumentOcrService;
import it.projectwork.documed.documentservice.service.GridFsStorageService;

/**
 * Verifies persisted OCR transitions, retries and failure handling.
 */
@ExtendWith(MockitoExtension.class)
class DocumentOcrServiceTest {

    private static final String DOCUMENT_ID = "document-1";
    private static final String GRID_FS_ID = "507f1f77bcf86cd799439011";
    private static final String AUTHORIZATION = "Bearer test-token";
    private static final byte[] IMAGE = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };

    @Mock
    private PatientDocumentRepository documentRepository;

    @Mock
    private GridFsStorageService gridFsStorageService;

    @Mock
    private OcrServiceClient ocrServiceClient;

    private DocumentOcrService documentOcrService;

    @BeforeEach
    void setUp() {
        documentOcrService = new DocumentOcrService(
                documentRepository, gridFsStorageService, ocrServiceClient);
    }

    @Test
    void transitionsFromProcessingToCompleted() {
        PatientDocument document = existingDocument(OcrStatus.PENDING);
        List<OcrStatus> persistedStatuses = captureSavedStatuses(document);
        configureSuccessfulOcr(document, "Testo estratto");

        DocumentOcrResponse response = documentOcrService.process(DOCUMENT_ID, AUTHORIZATION);

        assertThat(persistedStatuses).containsExactly(OcrStatus.PROCESSING, OcrStatus.COMPLETED);
        assertThat(response.getOcrStatus()).isEqualTo(OcrStatus.COMPLETED);
        assertThat(response.getExtractedText()).isEqualTo("Testo estratto");
        assertThat(response.getOcrErrorMessage()).isNull();
        assertThat(response.getProcessedAt()).isNotNull();
    }

    @Test
    void transitionsFromProcessingToFailedAndKeepsOriginalFile() {
        PatientDocument document = existingDocument(OcrStatus.PENDING);
        List<OcrStatus> persistedStatuses = captureSavedStatuses(document);
        when(documentRepository.findById(DOCUMENT_ID)).thenReturn(Optional.of(document));
        when(gridFsStorageService.load(GRID_FS_ID)).thenReturn(IMAGE);
        when(ocrServiceClient.extract(IMAGE, "sample.png", "image/png", AUTHORIZATION))
                .thenThrow(new IntegrationException(
                        "OCR_SERVICE_UNAVAILABLE", "OCR Service non disponibile"));

        assertThatThrownBy(() -> documentOcrService.process(DOCUMENT_ID, AUTHORIZATION))
                .isInstanceOf(IntegrationException.class)
                .extracting("code")
                .isEqualTo("OCR_SERVICE_UNAVAILABLE");

        assertThat(persistedStatuses).containsExactly(OcrStatus.PROCESSING, OcrStatus.FAILED);
        assertThat(document.getExtractedText()).isNull();
        assertThat(document.getOcrErrorMessage()).isEqualTo("OCR Service non disponibile");
        assertThat(document.getProcessedAt()).isNotNull();
        verify(gridFsStorageService, never()).delete(any(String.class));
    }

    @Test
    void repeatsCompletedOcrAndReplacesOldText() {
        PatientDocument document = existingDocument(OcrStatus.COMPLETED);
        document.setExtractedText("Testo precedente");
        document.setProcessedAt(Instant.parse("2026-06-19T12:00:00Z"));
        List<OcrStatus> persistedStatuses = new ArrayList<>();
        List<String> persistedTexts = new ArrayList<>();
        when(documentRepository.save(any(PatientDocument.class))).thenAnswer(invocation -> {
            PatientDocument saved = invocation.getArgument(0);
            persistedStatuses.add(saved.getOcrStatus());
            persistedTexts.add(saved.getExtractedText());
            return saved;
        });
        configureSuccessfulOcr(document, "Nuovo testo");

        DocumentOcrResponse response = documentOcrService.process(DOCUMENT_ID, AUTHORIZATION);

        assertThat(persistedStatuses).containsExactly(OcrStatus.PROCESSING, OcrStatus.COMPLETED);
        assertThat(persistedTexts).containsExactly(null, "Nuovo testo");
        assertThat(response.getExtractedText()).isEqualTo("Nuovo testo");
    }

    @Test
    void retriesAfterFailedState() {
        PatientDocument document = existingDocument(OcrStatus.FAILED);
        document.setOcrErrorMessage("Errore precedente");
        List<OcrStatus> persistedStatuses = captureSavedStatuses(document);
        configureSuccessfulOcr(document, "Testo recuperato");

        DocumentOcrResponse response = documentOcrService.process(DOCUMENT_ID, AUTHORIZATION);

        assertThat(persistedStatuses).containsExactly(OcrStatus.PROCESSING, OcrStatus.COMPLETED);
        assertThat(response.getExtractedText()).isEqualTo("Testo recuperato");
        assertThat(response.getOcrErrorMessage()).isNull();
    }

    @Test
    void reportsMissingDocumentWithoutCallingOcr() {
        when(documentRepository.findById(DOCUMENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> documentOcrService.process(DOCUMENT_ID, AUTHORIZATION))
                .isInstanceOf(ResourceNotFoundException.class)
                .extracting("code")
                .isEqualTo("DOCUMENT_NOT_FOUND");
        verify(ocrServiceClient, never()).extract(any(), any(), any(), any());
    }

    @Test
    void marksUnsupportedPdfAsFailed() {
        PatientDocument document = existingDocument(OcrStatus.PENDING);
        document.setOriginalFilename("sample.pdf");
        document.setContentType("application/pdf");
        List<OcrStatus> persistedStatuses = captureSavedStatuses(document);
        when(documentRepository.findById(DOCUMENT_ID)).thenReturn(Optional.of(document));
        when(gridFsStorageService.load(GRID_FS_ID)).thenReturn("%PDF".getBytes());
        when(ocrServiceClient.extract(any(), eq("sample.pdf"), eq("application/pdf"), eq(AUTHORIZATION)))
                .thenThrow(new BusinessRuleException(
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "OCR_UNSUPPORTED_MEDIA_TYPE",
                        "OCR disponibile solo per immagini PNG e JPEG"));

        assertThatThrownBy(() -> documentOcrService.process(DOCUMENT_ID, AUTHORIZATION))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code")
                .isEqualTo("OCR_UNSUPPORTED_MEDIA_TYPE");
        assertThat(persistedStatuses).containsExactly(OcrStatus.PROCESSING, OcrStatus.FAILED);
        assertThat(document.getOcrErrorMessage())
                .isEqualTo("OCR disponibile solo per immagini PNG e JPEG");
    }

    @Test
    void returnsStoredOcrResult() {
        PatientDocument document = existingDocument(OcrStatus.COMPLETED);
        document.setExtractedText("Testo archiviato");
        document.setProcessedAt(Instant.parse("2026-06-20T12:00:00Z"));
        when(documentRepository.findById(DOCUMENT_ID)).thenReturn(Optional.of(document));

        DocumentOcrResponse response = documentOcrService.findResult(DOCUMENT_ID);

        assertThat(response.getOcrStatus()).isEqualTo(OcrStatus.COMPLETED);
        assertThat(response.getExtractedText()).isEqualTo("Testo archiviato");
    }

    private List<OcrStatus> captureSavedStatuses(PatientDocument document) {
        List<OcrStatus> statuses = new ArrayList<>();
        when(documentRepository.save(any(PatientDocument.class))).thenAnswer(invocation -> {
            PatientDocument saved = invocation.getArgument(0);
            statuses.add(saved.getOcrStatus());
            return saved;
        });
        return statuses;
    }

    private void configureSuccessfulOcr(PatientDocument document, String text) {
        when(documentRepository.findById(DOCUMENT_ID)).thenReturn(Optional.of(document));
        when(gridFsStorageService.load(GRID_FS_ID)).thenReturn(IMAGE);
        OcrClientResponse result = new OcrClientResponse();
        result.setText(text);
        result.setLanguage("ita");
        result.setProcessingTimeMs(1200);
        when(ocrServiceClient.extract(IMAGE, "sample.png", "image/png", AUTHORIZATION))
                .thenReturn(result);
    }

    private PatientDocument existingDocument(OcrStatus status) {
        PatientDocument document = new PatientDocument();
        document.setId(DOCUMENT_ID);
        document.setGridFsFileId(GRID_FS_ID);
        document.setPatientId(42L);
        document.setAdmissionId(10L);
        document.setDocumentType(DocumentType.MEDICAL_REPORT);
        document.setOriginalFilename("sample.png");
        document.setContentType("image/png");
        document.setFileSize(IMAGE.length);
        document.setOcrStatus(status);
        document.setUploadedAt(Instant.parse("2026-06-20T10:00:00Z"));
        return document;
    }
}
