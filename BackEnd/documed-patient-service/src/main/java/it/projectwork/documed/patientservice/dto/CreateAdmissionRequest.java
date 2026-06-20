package it.projectwork.documed.patientservice.dto;

import java.time.LocalDate;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PastOrPresent;
import javax.validation.constraints.Size;

/**
 * Validated input used to open an admission.
 */
public class CreateAdmissionRequest {

    @NotNull(message = "La data di ingresso è obbligatoria")
    @PastOrPresent(message = "La data di ingresso non può essere futura")
    private LocalDate admissionDate;

    @NotBlank(message = "Il reparto è obbligatorio")
    @Size(max = 120, message = "Il reparto può contenere al massimo 120 caratteri")
    private String department;

    @Size(max = 2000, message = "Le note possono contenere al massimo 2000 caratteri")
    private String notes;

    public LocalDate getAdmissionDate() {
        return admissionDate;
    }

    public void setAdmissionDate(LocalDate admissionDate) {
        this.admissionDate = admissionDate;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
