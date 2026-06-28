package it.projectwork.documed.patientservice.service;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.projectwork.documed.patientservice.domain.Patient;
import it.projectwork.documed.patientservice.dto.CreatePatientRequest;
import it.projectwork.documed.patientservice.dto.PatientResponse;
import it.projectwork.documed.patientservice.dto.UpdatePatientRequest;
import it.projectwork.documed.patientservice.error.BusinessRuleException;
import it.projectwork.documed.patientservice.error.ResourceNotFoundException;
import it.projectwork.documed.patientservice.repository.AdmissionRepository;
import it.projectwork.documed.patientservice.repository.PatientRepository;

/**
 * Implements patient registry operations and keeps normalization rules in one
 * explicit place.
 */
@Service
public class PatientService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PatientService.class);

    private final PatientRepository patientRepository;
    private final AdmissionRepository admissionRepository;

    public PatientService(PatientRepository patientRepository, AdmissionRepository admissionRepository) {
        this.patientRepository = patientRepository;
        this.admissionRepository = admissionRepository;
    }

    /**
     * Registers a new patient after enforcing fiscal-code uniqueness.
     */
    @Transactional
    public PatientResponse create(CreatePatientRequest request) {
        String fiscalCode = normalizeFiscalCode(request.getFiscalCode());
        if (patientRepository.existsByFiscalCode(fiscalCode)) {
            throw duplicateFiscalCode();
        }

        Patient patient = new Patient();
        copyCreateFields(patient, request, fiscalCode);
        Patient saved = patientRepository.save(patient);
        LOGGER.info("Patient created: patientId={}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> findAll() {
        return patientRepository.findAllByOrderByLastNameAscFirstNameAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PatientResponse findById(Long patientId) {
        return toResponse(findEntity(patientId));
    }

    /**
     * Updates all editable registry fields; admission history is unaffected.
     */
    @Transactional
    public PatientResponse update(Long patientId, UpdatePatientRequest request) {
        Patient patient = findEntity(patientId);
        String fiscalCode = normalizeFiscalCode(request.getFiscalCode());
        if (patientRepository.existsByFiscalCodeAndIdNot(fiscalCode, patientId)) {
            throw duplicateFiscalCode();
        }

        patient.setFirstName(request.getFirstName().trim());
        patient.setLastName(request.getLastName().trim());
        patient.setFiscalCode(fiscalCode);
        patient.setBirthDate(request.getBirthDate());
        patient.setEmail(normalizeOptional(request.getEmail()));
        patient.setPhone(normalizeOptional(request.getPhone()));
        Patient saved = patientRepository.saveAndFlush(patient);
        LOGGER.info("Patient updated: patientId={}", patientId);
        return toResponse(saved);
    }

    /**
     * Deletes a registry entry only when it has no admission history. The
     * service deliberately avoids cascading clinical-administrative records,
     * because documents live in another microservice and must not become
     * orphaned silently.
     */
    @Transactional
    public void delete(Long patientId) {
        Patient patient = findEntity(patientId);
        if (admissionRepository.countByPatientId(patientId) > 0) {
            throw new BusinessRuleException(
                    "PATIENT_HAS_ADMISSIONS",
                    "Non è possibile eliminare un paziente con ricoveri registrati");
        }
        patientRepository.delete(patient);
        LOGGER.info("Patient deleted: patientId={}", patientId);
    }

    @Transactional(readOnly = true)
    public Patient findEntity(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "PATIENT_NOT_FOUND", "Paziente non trovato"));
    }

    private void copyCreateFields(Patient patient, CreatePatientRequest request, String fiscalCode) {
        patient.setFirstName(request.getFirstName().trim());
        patient.setLastName(request.getLastName().trim());
        patient.setFiscalCode(fiscalCode);
        patient.setBirthDate(request.getBirthDate());
        patient.setEmail(normalizeOptional(request.getEmail()));
        patient.setPhone(normalizeOptional(request.getPhone()));
    }

    private String normalizeFiscalCode(String fiscalCode) {
        return fiscalCode.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private BusinessRuleException duplicateFiscalCode() {
        return new BusinessRuleException(
                "FISCAL_CODE_ALREADY_EXISTS", "Esiste già un paziente con questo codice fiscale");
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getFiscalCode(),
                patient.getBirthDate(),
                patient.getEmail(),
                patient.getPhone(),
                patient.getCreatedAt(),
                patient.getUpdatedAt());
    }
}
