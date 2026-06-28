package it.projectwork.documed.patientservice.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import it.projectwork.documed.patientservice.domain.Admission;
import it.projectwork.documed.patientservice.domain.AdmissionStatus;

/**
 * Persistence operations and simple dashboard counts for admissions.
 */
public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    List<Admission> findByPatientIdOrderByAdmissionDateDescIdDesc(Long patientId);

    List<Admission> findAllByOrderByAdmissionDateDescIdDesc();

    boolean existsByPatientIdAndStatus(Long patientId, AdmissionStatus status);

    long countByPatientId(Long patientId);

    long countByStatus(AdmissionStatus status);

    long countByAdmissionDate(LocalDate admissionDate);

    long countByDischargeDate(LocalDate dischargeDate);
}
