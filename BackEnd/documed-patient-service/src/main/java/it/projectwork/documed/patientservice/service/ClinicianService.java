package it.projectwork.documed.patientservice.service;

import java.util.List;

import org.springframework.stereotype.Service;

import it.projectwork.documed.patientservice.dto.ClinicianResponse;

/**
 * Provides the small reference list of clinicians used by the admissions
 * prototype. It is intentionally static for now: these are lookup values, not
 * DocuMed user accounts.
 */
@Service
public class ClinicianService {

    private static final List<ClinicianResponse> CLINICIANS = List.of(
            new ClinicianResponse(1L, "Dott.ssa Elena Conti", "Cardiologia"),
            new ClinicianResponse(2L, "Dott. Paolo Neri", "Cardiologia"),
            new ClinicianResponse(3L, "Dott. Marco Vitale", "Ortopedia e traumatologia"),
            new ClinicianResponse(4L, "Dott.ssa Chiara Fontana", "Geriatria"),
            new ClinicianResponse(5L, "Dott. Luca Ferraro", "Neurologia"),
            new ClinicianResponse(6L, "Dott.ssa Anna Ricci", "Gastroenterologia"),
            new ClinicianResponse(7L, "Dott. Stefano Gallo", "Chirurgia generale"),
            new ClinicianResponse(8L, "Dott.ssa Federica Moretti", "Oncologia"),
            new ClinicianResponse(9L, "Dott.ssa Laura Serra", "Medicina generale"),
            new ClinicianResponse(10L, "Dott. Roberto Mancini", "Pneumologia"));

    @SuppressWarnings("java:S2384")
    public List<ClinicianResponse> findAll() {
        return CLINICIANS;
    }
}
