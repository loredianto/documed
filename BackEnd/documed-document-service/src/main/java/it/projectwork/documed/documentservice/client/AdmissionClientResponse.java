package it.projectwork.documed.documentservice.client;

/**
 * Minimal subset of the Patient Service admission response needed to derive
 * document ownership.
 */
public class AdmissionClientResponse {

    private Long id;
    private Long patientId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }
}
