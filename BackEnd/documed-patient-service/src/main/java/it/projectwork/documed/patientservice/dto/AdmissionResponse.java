package it.projectwork.documed.patientservice.dto;

import java.time.Instant;
import java.time.LocalDate;

import it.projectwork.documed.patientservice.domain.AdmissionStatus;

/**
 * Public representation of an admission.
 */
public class AdmissionResponse {

    private final Long id;
    private final Long patientId;
    private final LocalDate admissionDate;
    private final LocalDate dischargeDate;
    private final String department;
    private final String notes;
    private final AdmissionStatus status;
    private final Instant createdAt;
    private final Instant updatedAt;

    public AdmissionResponse(Long id, Long patientId, LocalDate admissionDate, LocalDate dischargeDate,
            String department, String notes, AdmissionStatus status, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.patientId = patientId;
        this.admissionDate = admissionDate;
        this.dischargeDate = dischargeDate;
        this.department = department;
        this.notes = notes;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public LocalDate getAdmissionDate() {
        return admissionDate;
    }

    public LocalDate getDischargeDate() {
        return dischargeDate;
    }

    public String getDepartment() {
        return department;
    }

    public String getNotes() {
        return notes;
    }

    public AdmissionStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
