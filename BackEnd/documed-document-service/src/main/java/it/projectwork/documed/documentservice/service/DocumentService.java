package it.projectwork.documed.documentservice.service;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.data.mongodb.core.query.TextQuery;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

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

/**
 * Coordinates admission validation, GridFS content and document metadata.
 */
@Service
public class DocumentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentService.class);

    private static final String PNG = "image/png";
    private static final String JPEG = "image/jpeg";
    private static final String PDF = "application/pdf";
    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of(PNG, JPEG, PDF);

    private static final byte[] PNG_SIGNATURE = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };
    private static final byte[] JPEG_SIGNATURE = new byte[] {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF
    };
    private static final byte[] PDF_SIGNATURE = new byte[] {
            0x25, 0x50, 0x44, 0x46, 0x2D
    };

    private final PatientDocumentRepository documentRepository;
    private final GridFsStorageService gridFsStorageService;
    private final PatientServiceClient patientServiceClient;
    private final MongoTemplate mongoTemplate;
    private final long maxFileSizeBytes;

    public DocumentService(PatientDocumentRepository documentRepository,
            GridFsStorageService gridFsStorageService,
            PatientServiceClient patientServiceClient,
            MongoTemplate mongoTemplate,
            @Value("${documents.max-file-size-bytes}") long maxFileSizeBytes) {
        if (maxFileSizeBytes <= 0) {
            throw new IllegalStateException("DOCUMENT_MAX_FILE_SIZE_BYTES must be positive");
        }
        this.documentRepository = documentRepository;
        this.gridFsStorageService = gridFsStorageService;
        this.patientServiceClient = patientServiceClient;
        this.mongoTemplate = mongoTemplate;
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    /**
     * Validates and stores one document. The patient identifier always comes
     * from the Patient Service admission response, never from frontend input.
     */
    public DocumentResponse upload(Long admissionId, DocumentUploadRequest request,
            String authorizationHeader) {
        ValidatedFile validatedFile = validateAndRead(request.getFile());
        AdmissionClientResponse admission = patientServiceClient.getAdmission(
                admissionId, authorizationHeader);

        String gridFsFileId = gridFsStorageService.store(
                validatedFile.content,
                validatedFile.originalFilename,
                validatedFile.contentType);

        PatientDocument document = new PatientDocument();
        document.setGridFsFileId(gridFsFileId);
        document.setPatientId(admission.getPatientId());
        document.setAdmissionId(admission.getId());
        document.setDocumentType(request.getDocumentType());
        document.setOriginalFilename(validatedFile.originalFilename);
        document.setDescription(normalizeOptional(request.getDescription()));
        document.setContentType(validatedFile.contentType);
        document.setFileSize(validatedFile.content.length);
        // OCR is deliberately deferred to the next project phase.
        document.setOcrStatus(OcrStatus.PENDING);
        document.setUploadedAt(Instant.now());

        try {
            PatientDocument saved = documentRepository.save(document);
            LOGGER.info("Document uploaded: documentId={}, admissionId={}, patientId={}",
                    saved.getId(), saved.getAdmissionId(), saved.getPatientId());
            return toResponse(saved);
        } catch (RuntimeException metadataException) {
            // GridFS and metadata are separate writes. Compensate immediately
            // so a failed metadata write cannot leave an orphaned binary.
            try {
                gridFsStorageService.delete(gridFsFileId);
            } catch (RuntimeException cleanupException) {
                metadataException.addSuppressed(cleanupException);
                LOGGER.error("GridFS cleanup failed after metadata error: gridFsFileId={}",
                        gridFsFileId, cleanupException);
            }
            throw new DocumentStorageException(
                    "DOCUMENT_METADATA_SAVE_ERROR",
                    "Impossibile salvare i metadati del documento",
                    metadataException);
        }
    }

    public List<DocumentResponse> findAll() {
        return documentRepository.findAllByOrderByUploadedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Validates the admission before returning its document list.
     */
    public List<DocumentResponse> findByAdmission(Long admissionId, String authorizationHeader) {
        patientServiceClient.getAdmission(admissionId, authorizationHeader);
        return documentRepository.findByAdmissionIdOrderByUploadedAtDesc(admissionId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DocumentResponse findById(String documentId) {
        return toResponse(findEntity(documentId));
    }

    public DocumentContentResponse download(String documentId) {
        PatientDocument document = findEntity(documentId);
        byte[] content = gridFsStorageService.load(document.getGridFsFileId());
        return new DocumentContentResponse(
                content, document.getOriginalFilename(), document.getContentType());
    }

    /**
     * Deletes binary content first. If metadata deletion then fails, retrying
     * the operation safely completes cleanup because GridFS delete is idempotent.
     */
    public void delete(String documentId) {
        PatientDocument document = findEntity(documentId);
        gridFsStorageService.delete(document.getGridFsFileId());
        documentRepository.delete(document);
        LOGGER.info("Document deleted: documentId={}, admissionId={}",
                documentId, document.getAdmissionId());
    }

    /**
     * Searches the MongoDB text index and optional exact metadata filters.
     */
    public List<DocumentResponse> search(DocumentSearchCriteria criteria) {
        Query query;
        if (StringUtils.hasText(criteria.getQuery())) {
            TextCriteria textCriteria = TextCriteria.forDefaultLanguage()
                    .matching(criteria.getQuery().trim());
            query = TextQuery.queryText(textCriteria).sortByScore();
        } else {
            query = new Query();
        }

        addExactFilter(query, "patientId", criteria.getPatientId());
        addExactFilter(query, "admissionId", criteria.getAdmissionId());
        addExactFilter(query, "documentType", criteria.getDocumentType());
        addExactFilter(query, "ocrStatus", criteria.getOcrStatus());
        query.with(Sort.by(Sort.Direction.DESC, "uploadedAt"));
        query.limit(500);

        return mongoTemplate.find(query, PatientDocument.class).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DocumentStatisticsResponse statistics() {
        Map<DocumentType, Long> byType = new EnumMap<>(DocumentType.class);
        for (DocumentType type : DocumentType.values()) {
            byType.put(type, documentRepository.countByDocumentType(type));
        }
        Map<OcrStatus, Long> byOcrStatus = new EnumMap<>(OcrStatus.class);
        for (OcrStatus status : OcrStatus.values()) {
            byOcrStatus.put(status, documentRepository.countByOcrStatus(status));
        }
        return new DocumentStatisticsResponse(documentRepository.count(), byType, byOcrStatus);
    }

    private ValidatedFile validateAndRead(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException(
                    HttpStatus.BAD_REQUEST, "EMPTY_FILE", "Il file non può essere vuoto");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new BusinessRuleException(
                    HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE",
                    "Il file supera la dimensione massima consentita");
        }

        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessRuleException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE",
                    "Sono supportati solo file PNG, JPEG e PDF");
        }

        try {
            byte[] content = file.getBytes();
            if (content.length > maxFileSizeBytes) {
                throw new BusinessRuleException(
                        HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE",
                        "Il file supera la dimensione massima consentita");
            }
            if (!signatureMatches(contentType, content)) {
                throw new BusinessRuleException(
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE, "FILE_CONTENT_TYPE_MISMATCH",
                        "Il contenuto del file non corrisponde al MIME type dichiarato");
            }
            return new ValidatedFile(
                    content,
                    sanitizeFilename(file.getOriginalFilename()),
                    contentType);
        } catch (IOException exception) {
            throw new DocumentStorageException(
                    "DOCUMENT_FILE_READ_ERROR", "Impossibile leggere il file caricato", exception);
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        int parametersStart = contentType.indexOf(';');
        String value = parametersStart >= 0
                ? contentType.substring(0, parametersStart)
                : contentType;
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean signatureMatches(String contentType, byte[] content) {
        if (PNG.equals(contentType)) {
            return startsWith(content, PNG_SIGNATURE);
        }
        if (JPEG.equals(contentType)) {
            return startsWith(content, JPEG_SIGNATURE);
        }
        if (PDF.equals(contentType)) {
            return startsWith(content, PDF_SIGNATURE);
        }
        return false;
    }

    private boolean startsWith(byte[] content, byte[] signature) {
        return content.length >= signature.length
                && Arrays.equals(Arrays.copyOf(content, signature.length), signature);
    }

    private String sanitizeFilename(String originalFilename) {
        String filename = originalFilename == null ? "document" : originalFilename;
        filename = filename.replace('\\', '/');
        int lastSeparator = filename.lastIndexOf('/');
        if (lastSeparator >= 0) {
            filename = filename.substring(lastSeparator + 1);
        }
        filename = filename.replaceAll("[\\r\\n\\t]", "_").trim();
        if (filename.isEmpty() || ".".equals(filename) || "..".equals(filename)) {
            filename = "document";
        }
        return filename.length() > 255 ? filename.substring(0, 255) : filename;
    }

    private String normalizeOptional(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private void addExactFilter(Query query, String field, Object value) {
        if (value != null) {
            query.addCriteria(Criteria.where(field).is(value));
        }
    }

    private PatientDocument findEntity(String documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "DOCUMENT_NOT_FOUND", "Documento non trovato"));
    }

    private DocumentResponse toResponse(PatientDocument document) {
        return new DocumentResponse(
                document.getId(),
                document.getPatientId(),
                document.getAdmissionId(),
                document.getDocumentType(),
                document.getOriginalFilename(),
                document.getDescription(),
                document.getContentType(),
                document.getFileSize(),
                document.getOcrStatus(),
                document.getExtractedText(),
                document.getOcrErrorMessage(),
                document.getUploadedAt(),
                document.getProcessedAt());
    }

    private static final class ValidatedFile {
        private final byte[] content;
        private final String originalFilename;
        private final String contentType;

        private ValidatedFile(byte[] content, String originalFilename, String contentType) {
            this.content = content;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
        }
    }
}
