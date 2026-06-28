package it.projectwork.documed.patientservice.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.projectwork.documed.patientservice.domain.Admission;
import it.projectwork.documed.patientservice.domain.AdmissionStatus;
import it.projectwork.documed.patientservice.domain.Patient;
import it.projectwork.documed.patientservice.dto.AdmissionResponse;
import it.projectwork.documed.patientservice.dto.CreateAdmissionRequest;
import it.projectwork.documed.patientservice.dto.DailyAdmissionStatisticsResponse;
import it.projectwork.documed.patientservice.dto.DischargeAdmissionRequest;
import it.projectwork.documed.patientservice.dto.PatientStatisticsResponse;
import it.projectwork.documed.patientservice.error.BusinessRuleException;
import it.projectwork.documed.patientservice.error.ResourceNotFoundException;
import it.projectwork.documed.patientservice.repository.AdmissionRepository;
import it.projectwork.documed.patientservice.repository.PatientRepository;

/**
 * Manages the admission lifecycle and dashboard counters.
 */
@Service
public class AdmissionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdmissionService.class);

    private final AdmissionRepository admissionRepository;
    private final PatientRepository patientRepository;
    private final ZoneId applicationZone;

    public AdmissionService(AdmissionRepository admissionRepository, PatientRepository patientRepository,
            @Value("${application.time-zone:Europe/Rome}") String applicationTimeZone) {
        this.admissionRepository = admissionRepository;
        this.patientRepository = patientRepository;
        this.applicationZone = ZoneId.of(applicationTimeZone);
    }

    /**
     * Opens an admission if the patient exists and has no active admission.
     */
    @Transactional
    public AdmissionResponse open(Long patientId, CreateAdmissionRequest request) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "PATIENT_NOT_FOUND", "Paziente non trovato"));
        if (admissionRepository.existsByPatientIdAndStatus(patientId, AdmissionStatus.ACTIVE)) {
            throw new BusinessRuleException(
                    "ACTIVE_ADMISSION_ALREADY_EXISTS", "Il paziente ha già un ricovero attivo");
        }

        Admission admission = new Admission();
        admission.setPatient(patient);
        admission.setAdmissionDate(request.getAdmissionDate());
        admission.setDepartment(request.getDepartment().trim());
        admission.setNotes(normalizeOptional(request.getNotes()));
        admission.setStatus(AdmissionStatus.ACTIVE);
        Admission saved = admissionRepository.save(admission);
        LOGGER.info("Admission opened: admissionId={}, patientId={}", saved.getId(), patientId);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AdmissionResponse> findByPatient(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("PATIENT_NOT_FOUND", "Paziente non trovato");
        }
        return admissionRepository.findByPatientIdOrderByAdmissionDateDescIdDesc(patientId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdmissionResponse> findAll() {
        return admissionRepository.findAllByOrderByAdmissionDateDescIdDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdmissionResponse findById(Long admissionId) {
        return toResponse(findEntity(admissionId));
    }

    /**
     * Transitions an active admission to DISCHARGED exactly once.
     */
    @Transactional
    public AdmissionResponse discharge(Long admissionId, DischargeAdmissionRequest request) {
        Admission admission = findEntity(admissionId);
        if (admission.getStatus() == AdmissionStatus.DISCHARGED) {
            throw new BusinessRuleException(
                    "ADMISSION_ALREADY_DISCHARGED", "Il ricovero è già stato dimesso");
        }
        if (request.getDischargeDate().isBefore(admission.getAdmissionDate())) {
            throw new BusinessRuleException(
                    "INVALID_DISCHARGE_DATE",
                    "La data di dimissione non può precedere la data di ingresso");
        }

        admission.setDischargeDate(request.getDischargeDate());
        admission.setStatus(AdmissionStatus.DISCHARGED);
        Admission saved = admissionRepository.saveAndFlush(admission);
        LOGGER.info("Admission discharged: admissionId={}, patientId={}",
                admissionId, admission.getPatient().getId());
        return toResponse(saved);
    }

    /**
     * Returns today's counters and one point for each of the last seven days.
     */
    @Transactional(readOnly = true)
    public PatientStatisticsResponse statistics() {
        LocalDate today = LocalDate.now(applicationZone);
        List<DailyAdmissionStatisticsResponse> daily = new ArrayList<>();
        for (int daysAgo = 6; daysAgo >= 0; daysAgo--) {
            LocalDate date = today.minusDays(daysAgo);
            daily.add(new DailyAdmissionStatisticsResponse(
                    date,
                    admissionRepository.countByAdmissionDate(date),
                    admissionRepository.countByDischargeDate(date)));
        }
        return new PatientStatisticsResponse(
                patientRepository.count(),
                admissionRepository.countByStatus(AdmissionStatus.ACTIVE),
                admissionRepository.countByAdmissionDate(today),
                admissionRepository.countByDischargeDate(today),
                daily);
    }

    /**
     * Returns daily admission/discharge activity for an inclusive date range.
     * A one-year limit keeps accidental wide dashboard queries bounded.
     */
    @Transactional(readOnly = true)
    public List<DailyAdmissionStatisticsResponse> activity(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new BusinessRuleException(
                    "INVALID_ACTIVITY_RANGE", "La data iniziale non può essere successiva alla data finale");
        }
        if (ChronoUnit.DAYS.between(from, to) > 366) {
            throw new BusinessRuleException(
                    "ACTIVITY_RANGE_TOO_LARGE", "L'intervallo massimo consentito è di 366 giorni");
        }

        List<DailyAdmissionStatisticsResponse> daily = new ArrayList<>();
        LocalDate current = from;
        while (!current.isAfter(to)) {
            daily.add(new DailyAdmissionStatisticsResponse(
                    current,
                    admissionRepository.countByAdmissionDate(current),
                    admissionRepository.countByDischargeDate(current)));
            current = current.plusDays(1);
        }
        return daily;
    }

    @Transactional
    public void delete(Long admissionId) {
        Admission admission = findEntity(admissionId);
        admissionRepository.delete(admission);
        LOGGER.info("Admission deleted: admissionId={}, patientId={}",
                admissionId, admission.getPatient().getId());
    }

    private Admission findEntity(Long admissionId) {
        return admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ADMISSION_NOT_FOUND", "Ricovero non trovato"));
    }

    private AdmissionResponse toResponse(Admission admission) {
        return new AdmissionResponse(
                admission.getId(),
                admission.getPatient().getId(),
                admission.getAdmissionDate(),
                admission.getDischargeDate(),
                admission.getDepartment(),
                admission.getNotes(),
                admission.getStatus(),
                admission.getCreatedAt(),
                admission.getUpdatedAt());
    }

    private String normalizeOptional(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
