package it.projectwork.documed.patientservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import it.projectwork.documed.patientservice.domain.Patient;

/**
 * Persistence operations for the patient registry.
 */
public interface PatientRepository extends JpaRepository<Patient, Long> {

    boolean existsByFiscalCode(String fiscalCode);

    boolean existsByFiscalCodeAndIdNot(String fiscalCode, Long id);

    List<Patient> findAllByOrderByLastNameAscFirstNameAsc();
}
