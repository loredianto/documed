package it.projectwork.documed.patientservice.dto;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Public representation of a patient without persistence internals.
 */
public class PatientResponse {

    private final Long id;
    private final String firstName;
    private final String lastName;
    private final String fiscalCode;
    private final LocalDate birthDate;
    private final String email;
    private final String phone;
    private final Instant createdAt;
    private final Instant updatedAt;

    public PatientResponse(Long id, String firstName, String lastName, String fiscalCode,
            LocalDate birthDate, String email, String phone, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.fiscalCode = fiscalCode;
        this.birthDate = birthDate;
        this.email = email;
        this.phone = phone;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getFiscalCode() {
        return fiscalCode;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
