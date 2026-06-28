package it.projectwork.documed.patientservice.dto;

/**
 * Doctor/clinician option used by the frontend when the operator links a
 * structured OCR document to the signing physician.
 */
public class ClinicianResponse {

    private final Long id;
    private final String name;
    private final String department;

    public ClinicianResponse(Long id, String name, String department) {
        this.id = id;
        this.name = name;
        this.department = department;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDepartment() {
        return department;
    }
}
