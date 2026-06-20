package it.projectwork.documed.patientservice.dto;

import java.time.LocalDate;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.PastOrPresent;

/**
 * Date used to close an active admission.
 */
public class DischargeAdmissionRequest {

    @NotNull(message = "La data di dimissione è obbligatoria")
    @PastOrPresent(message = "La data di dimissione non può essere futura")
    private LocalDate dischargeDate;

    public LocalDate getDischargeDate() {
        return dischargeDate;
    }

    public void setDischargeDate(LocalDate dischargeDate) {
        this.dischargeDate = dischargeDate;
    }
}
