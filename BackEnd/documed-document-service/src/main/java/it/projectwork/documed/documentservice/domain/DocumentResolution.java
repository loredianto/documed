package it.projectwork.documed.documentservice.domain;

/**
 * Links a digital document to known DocuMed entities.
 */
public class DocumentResolution {

    private Long patientId;
    private Long doctorId;
    private Long admissionId;
    private PatientMatch patientMatch;

    public DocumentResolution() {
    }

    public DocumentResolution(Long patientId, Long doctorId, Long admissionId,
            PatientMatch patientMatch) {
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.admissionId = admissionId;
        this.patientMatch = patientMatch;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public Long getAdmissionId() {
        return admissionId;
    }

    public void setAdmissionId(Long admissionId) {
        this.admissionId = admissionId;
    }

    public PatientMatch getPatientMatch() {
        return patientMatch;
    }

    public void setPatientMatch(PatientMatch patientMatch) {
        this.patientMatch = patientMatch;
    }
}
