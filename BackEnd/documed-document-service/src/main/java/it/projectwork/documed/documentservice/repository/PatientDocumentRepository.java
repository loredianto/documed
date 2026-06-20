package it.projectwork.documed.documentservice.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import it.projectwork.documed.documentservice.domain.DocumentType;
import it.projectwork.documed.documentservice.domain.OcrStatus;
import it.projectwork.documed.documentservice.domain.PatientDocument;

/**
 * Metadata persistence and simple document counters.
 */
public interface PatientDocumentRepository extends MongoRepository<PatientDocument, String> {

    List<PatientDocument> findAllByOrderByUploadedAtDesc();

    List<PatientDocument> findByAdmissionIdOrderByUploadedAtDesc(Long admissionId);

    long countByDocumentType(DocumentType documentType);

    long countByOcrStatus(OcrStatus ocrStatus);
}
