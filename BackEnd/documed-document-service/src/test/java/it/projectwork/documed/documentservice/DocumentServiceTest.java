package it.projectwork.documed.documentservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import it.projectwork.documed.documentservice.client.AdmissionClientResponse;
import it.projectwork.documed.documentservice.client.PatientServiceClient;
import it.projectwork.documed.documentservice.domain.DocumentType;
import it.projectwork.documed.documentservice.domain.OcrStatus;
import it.projectwork.documed.documentservice.domain.PatientDocument;
import it.projectwork.documed.documentservice.dto.DocumentContentResponse;
import it.projectwork.documed.documentservice.dto.DocumentResponse;
import it.projectwork.documed.documentservice.dto.DocumentSearchCriteria;
import it.projectwork.documed.documentservice.dto.DocumentStatisticsResponse;
import it.projectwork.documed.documentservice.dto.DocumentUploadRequest;
import it.projectwork.documed.documentservice.error.BusinessRuleException;
import it.projectwork.documed.documentservice.error.DocumentStorageException;
import it.projectwork.documed.documentservice.error.ResourceNotFoundException;
import it.projectwork.documed.documentservice.repository.PatientDocumentRepository;
import it.projectwork.documed.documentservice.service.DocumentService;
import it.projectwork.documed.documentservice.service.GridFsStorageService;

/**
 * Verifies document business rules and GridFS compensation without requiring a
 * live MongoDB instance.
 */
@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    private static final long ADMISSION_ID = 10L;
    private static final long PATIENT_ID = 42L;
    private static final String AUTHORIZATION = "Bearer test-token";
    private static final String GRID_FS_ID = "507f1f77bcf86cd799439011";

    @Mock
    private PatientDocumentRepository documentRepository;

    @Mock
    private GridFsStorageService gridFsStorageService;

    @Mock
    private PatientServiceClient patientServiceClient;

    @Mock
    private MongoTemplate mongoTemplate;

    private DocumentService documentService;

    @BeforeEach
    void setUp() {
        documentService = new DocumentService(
                documentRepository,
                gridFsStorageService,
                patientServiceClient,
                mongoTemplate,
                1024);
    }

    @Test
    void uploadsValidDocumentAndDerivesPatientFromAdmission() {
        configureExistingAdmission();
        when(gridFsStorageService.store(any(byte[].class), eq("report.png"), eq("image/png")))
                .thenReturn(GRID_FS_ID);
        when(documentRepository.save(any(PatientDocument.class))).thenAnswer(invocation -> {
            PatientDocument document = invocation.getArgument(0);
            document.setId("document-1");
            return document;
        });

        DocumentResponse response = documentService.upload(
                ADMISSION_ID, validUpload("../report.png"), AUTHORIZATION);

        assertThat(response.getId()).isEqualTo("document-1");
        assertThat(response.getPatientId()).isEqualTo(PATIENT_ID);
        assertThat(response.getAdmissionId()).isEqualTo(ADMISSION_ID);
        assertThat(response.getOriginalFilename()).isEqualTo("report.png");
        assertThat(response.getOcrStatus()).isEqualTo(OcrStatus.PENDING);
        assertThat(response.isFiledInRecord()).isFalse();

        ArgumentCaptor<PatientDocument> metadata = ArgumentCaptor.forClass(PatientDocument.class);
        verify(documentRepository).save(metadata.capture());
        assertThat(metadata.getValue().getGridFsFileId()).isEqualTo(GRID_FS_ID);
        assertThat(metadata.getValue().getPatientId()).isEqualTo(PATIENT_ID);
        assertThat(metadata.getValue().getExtractedText()).isNull();
        assertThat(metadata.getValue().isFiledInRecord()).isFalse();
    }

    @Test
    void rejectsUnsupportedMimeType() {
        DocumentUploadRequest request = upload(new MockMultipartFile(
                "file", "notes.txt", "text/plain", "test".getBytes()));

        assertThatThrownBy(() -> documentService.upload(ADMISSION_ID, request, AUTHORIZATION))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(exception -> {
                    BusinessRuleException businessException = (BusinessRuleException) exception;
                    assertThat(businessException.getStatus()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
                    assertThat(businessException.getCode()).isEqualTo("UNSUPPORTED_MEDIA_TYPE");
                });
        verifyNoInteractions(patientServiceClient, gridFsStorageService, documentRepository);
    }

    @Test
    void rejectsFileLargerThanConfiguredLimit() {
        byte[] content = new byte[1025];
        System.arraycopy(validPngBytes(), 0, content, 0, validPngBytes().length);
        DocumentUploadRequest request = upload(new MockMultipartFile(
                "file", "large.png", "image/png", content));

        assertThatThrownBy(() -> documentService.upload(ADMISSION_ID, request, AUTHORIZATION))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(exception -> {
                    BusinessRuleException businessException = (BusinessRuleException) exception;
                    assertThat(businessException.getStatus()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
                    assertThat(businessException.getCode()).isEqualTo("FILE_TOO_LARGE");
                });
        verifyNoInteractions(patientServiceClient, gridFsStorageService, documentRepository);
    }

    @Test
    void rejectsContentThatDoesNotMatchDeclaredMimeType() {
        DocumentUploadRequest request = upload(new MockMultipartFile(
                "file", "fake.png", "image/png", "%PDF-fake".getBytes()));

        assertThatThrownBy(() -> documentService.upload(ADMISSION_ID, request, AUTHORIZATION))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code")
                .isEqualTo("FILE_CONTENT_TYPE_MISMATCH");
    }

    @Test
    void rejectsMissingAdmissionBeforeGridFsWrite() {
        when(patientServiceClient.getAdmission(ADMISSION_ID, AUTHORIZATION))
                .thenThrow(new ResourceNotFoundException(
                        "ADMISSION_NOT_FOUND", "Ricovero non trovato"));

        assertThatThrownBy(() -> documentService.upload(
                ADMISSION_ID, validUpload("report.png"), AUTHORIZATION))
                .isInstanceOf(ResourceNotFoundException.class)
                .extracting("code")
                .isEqualTo("ADMISSION_NOT_FOUND");
        verify(gridFsStorageService, never()).store(any(), anyString(), anyString());
    }

    @Test
    void retrievesDocumentMetadata() {
        PatientDocument metadata = existingDocument();
        when(documentRepository.findById("document-1")).thenReturn(Optional.of(metadata));

        DocumentResponse response = documentService.findById("document-1");

        assertThat(response.getId()).isEqualTo("document-1");
        assertThat(response.getPatientId()).isEqualTo(PATIENT_ID);
        assertThat(response.getDocumentType()).isEqualTo(DocumentType.MEDICAL_REPORT);
    }

    @Test
    void downloadsGridFsContent() {
        PatientDocument metadata = existingDocument();
        byte[] content = validPngBytes();
        when(documentRepository.findById("document-1")).thenReturn(Optional.of(metadata));
        when(gridFsStorageService.load(GRID_FS_ID)).thenReturn(content);

        DocumentContentResponse response = documentService.download("document-1");

        assertThat(response.getContent()).isEqualTo(content);
        assertThat(response.getOriginalFilename()).isEqualTo("report.png");
        assertThat(response.getContentType()).isEqualTo("image/png");
    }

    @Test
    void deletesGridFsContentBeforeMetadata() {
        PatientDocument metadata = existingDocument();
        when(documentRepository.findById("document-1")).thenReturn(Optional.of(metadata));

        documentService.delete("document-1");

        InOrder deletionOrder = inOrder(gridFsStorageService, documentRepository);
        deletionOrder.verify(gridFsStorageService).delete(GRID_FS_ID);
        deletionOrder.verify(documentRepository).delete(metadata);
    }

    @Test
    void removesGridFsFileWhenMetadataSaveFails() {
        configureExistingAdmission();
        when(gridFsStorageService.store(any(byte[].class), anyString(), eq("image/png")))
                .thenReturn(GRID_FS_ID);
        when(documentRepository.save(any(PatientDocument.class)))
                .thenThrow(new RuntimeException("Mongo metadata unavailable"));

        assertThatThrownBy(() -> documentService.upload(
                ADMISSION_ID, validUpload("report.png"), AUTHORIZATION))
                .isInstanceOf(DocumentStorageException.class)
                .extracting("code")
                .isEqualTo("DOCUMENT_METADATA_SAVE_ERROR");
        verify(gridFsStorageService).delete(GRID_FS_ID);
    }

    @Test
    void searchesTextAndExactFilters() {
        PatientDocument metadata = existingDocument();
        when(mongoTemplate.find(any(Query.class), eq(PatientDocument.class)))
                .thenReturn(Collections.singletonList(metadata));
        DocumentSearchCriteria criteria = new DocumentSearchCriteria();
        criteria.setQuery("report");
        criteria.setPatientId(PATIENT_ID);
        criteria.setOcrStatus(OcrStatus.PENDING);

        assertThat(documentService.search(criteria)).hasSize(1);

        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongoTemplate).find(query.capture(), eq(PatientDocument.class));
        assertThat(query.getValue().getQueryObject()).containsKeys("$text", "patientId", "ocrStatus");
        assertThat(query.getValue().getLimit()).isEqualTo(500);
    }

    @Test
    void returnsDocumentStatistics() {
        when(documentRepository.count()).thenReturn(3L);
        when(documentRepository.countByDocumentType(any(DocumentType.class))).thenAnswer(invocation ->
                invocation.getArgument(0) == DocumentType.MEDICAL_REPORT ? 2L : 0L);
        when(documentRepository.countByOcrStatus(any(OcrStatus.class))).thenAnswer(invocation ->
                invocation.getArgument(0) == OcrStatus.PENDING ? 3L : 0L);

        DocumentStatisticsResponse statistics = documentService.statistics();

        assertThat(statistics.getTotalDocuments()).isEqualTo(3);
        assertThat(statistics.getDocumentsByType().get(DocumentType.MEDICAL_REPORT)).isEqualTo(2);
        assertThat(statistics.getDocumentsByOcrStatus().get(OcrStatus.PENDING)).isEqualTo(3);
    }

    @Test
    void filesDocumentInAdmissionRecord() {
        PatientDocument metadata = existingDocument();
        when(documentRepository.findById("document-1")).thenReturn(Optional.of(metadata));
        when(documentRepository.save(any(PatientDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        documentService.fileInRecord("document-1");

        assertThat(metadata.isFiledInRecord()).isTrue();
        verify(documentRepository).save(metadata);
    }

    private void configureExistingAdmission() {
        AdmissionClientResponse admission = new AdmissionClientResponse();
        admission.setId(ADMISSION_ID);
        admission.setPatientId(PATIENT_ID);
        when(patientServiceClient.getAdmission(ADMISSION_ID, AUTHORIZATION)).thenReturn(admission);
    }

    private DocumentUploadRequest validUpload(String filename) {
        return upload(new MockMultipartFile(
                "file", filename, "image/png", validPngBytes()));
    }

    private DocumentUploadRequest upload(MockMultipartFile file) {
        DocumentUploadRequest request = new DocumentUploadRequest();
        request.setFile(file);
        request.setDocumentType(DocumentType.MEDICAL_REPORT);
        request.setDescription("Documento sintetico per test");
        return request;
    }

    private byte[] validPngBytes() {
        return new byte[] {
                (byte) 0x89, 0x50, 0x4E, 0x47,
                0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x00
        };
    }

    private PatientDocument existingDocument() {
        PatientDocument document = new PatientDocument();
        document.setId("document-1");
        document.setGridFsFileId(GRID_FS_ID);
        document.setPatientId(PATIENT_ID);
        document.setAdmissionId(ADMISSION_ID);
        document.setDocumentType(DocumentType.MEDICAL_REPORT);
        document.setOriginalFilename("report.png");
        document.setContentType("image/png");
        document.setFileSize(validPngBytes().length);
        document.setOcrStatus(OcrStatus.PENDING);
        document.setUploadedAt(Instant.parse("2026-06-20T12:00:00Z"));
        return document;
    }
}
