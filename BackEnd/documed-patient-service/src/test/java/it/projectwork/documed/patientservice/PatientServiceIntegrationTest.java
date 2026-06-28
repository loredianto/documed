package it.projectwork.documed.patientservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.jwt.JwtHelper;
import org.springframework.security.jwt.crypto.sign.MacSigner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import it.projectwork.documed.patientservice.domain.AdmissionStatus;
import it.projectwork.documed.patientservice.dto.AdmissionResponse;
import it.projectwork.documed.patientservice.dto.CreateAdmissionRequest;
import it.projectwork.documed.patientservice.dto.CreatePatientRequest;
import it.projectwork.documed.patientservice.dto.DischargeAdmissionRequest;
import it.projectwork.documed.patientservice.dto.PatientResponse;
import it.projectwork.documed.patientservice.dto.PatientStatisticsResponse;
import it.projectwork.documed.patientservice.error.BusinessRuleException;
import it.projectwork.documed.patientservice.error.ResourceNotFoundException;
import it.projectwork.documed.patientservice.service.AdmissionService;
import it.projectwork.documed.patientservice.service.PatientService;

/**
 * Covers the essential Patient Service domain flow against an in-memory SQL
 * database. PostgreSQL schema details are kept in the Flyway migration.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:patient_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "security.jwt.signing-key=test-jwt-signing-key-with-more-than-32-characters"
})
@AutoConfigureMockMvc
@Transactional
class PatientServiceIntegrationTest {

    private static final String SIGNING_KEY =
            "test-jwt-signing-key-with-more-than-32-characters";

    @Autowired
    private PatientService patientService;

    @Autowired
    private AdmissionService admissionService;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void rejectsRequestsWithoutToken() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void validatesApiInputForAdminToken() throws Exception {
        mockMvc.perform(post("/api/patients")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.firstName").exists())
                .andExpect(jsonPath("$.fieldErrors.fiscalCode").exists());
    }

    @Test
    void createsPatientAndNormalizesFiscalCode() {
        PatientResponse patient = patientService.create(patientRequest("rssmra80a01h501u"));

        assertThat(patient.getId()).isNotNull();
        assertThat(patient.getFiscalCode()).isEqualTo("RSSMRA80A01H501U");
        assertThat(patient.getCreatedAt()).isNotNull();
    }

    @Test
    void rejectsDuplicateFiscalCode() {
        patientService.create(patientRequest("RSSMRA80A01H501U"));

        assertThatThrownBy(() -> patientService.create(patientRequest("rssmra80a01h501u")))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code")
                .isEqualTo("FISCAL_CODE_ALREADY_EXISTS");
    }

    @Test
    void opensAdmission() {
        PatientResponse patient = patientService.create(patientRequest("RSSMRA80A01H501U"));

        AdmissionResponse admission = admissionService.open(patient.getId(), admissionRequest(LocalDate.now()));

        assertThat(admission.getPatientId()).isEqualTo(patient.getId());
        assertThat(admission.getStatus()).isEqualTo(AdmissionStatus.ACTIVE);
        assertThat(admission.getDischargeDate()).isNull();
    }

    @Test
    void rejectsSecondActiveAdmission() {
        PatientResponse patient = patientService.create(patientRequest("RSSMRA80A01H501U"));
        admissionService.open(patient.getId(), admissionRequest(LocalDate.now().minusDays(1)));

        assertThatThrownBy(() -> admissionService.open(patient.getId(), admissionRequest(LocalDate.now())))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code")
                .isEqualTo("ACTIVE_ADMISSION_ALREADY_EXISTS");
    }

    @Test
    void dischargesAdmission() {
        AdmissionResponse admission = openAdmission(LocalDate.now().minusDays(1));
        DischargeAdmissionRequest request = dischargeRequest(LocalDate.now());

        AdmissionResponse discharged = admissionService.discharge(admission.getId(), request);

        assertThat(discharged.getStatus()).isEqualTo(AdmissionStatus.DISCHARGED);
        assertThat(discharged.getDischargeDate()).isEqualTo(LocalDate.now());
    }

    @Test
    void rejectsSecondDischarge() {
        AdmissionResponse admission = openAdmission(LocalDate.now().minusDays(1));
        admissionService.discharge(admission.getId(), dischargeRequest(LocalDate.now()));

        assertThatThrownBy(() -> admissionService.discharge(
                admission.getId(), dischargeRequest(LocalDate.now())))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code")
                .isEqualTo("ADMISSION_ALREADY_DISCHARGED");
    }

    @Test
    void reportsMissingAdmission() {
        assertThatThrownBy(() -> admissionService.findById(999999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .extracting("code")
                .isEqualTo("ADMISSION_NOT_FOUND");
    }

    @Test
    void rejectsDischargeBeforeAdmission() {
        AdmissionResponse admission = openAdmission(LocalDate.now());

        assertThatThrownBy(() -> admissionService.discharge(
                admission.getId(), dischargeRequest(LocalDate.now().minusDays(1))))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code")
                .isEqualTo("INVALID_DISCHARGE_DATE");
    }

    @Test
    void returnsDashboardStatisticsForLastSevenDays() {
        AdmissionResponse admission = openAdmission(LocalDate.now());
        admissionService.discharge(admission.getId(), dischargeRequest(LocalDate.now()));

        PatientStatisticsResponse statistics = admissionService.statistics();

        assertThat(statistics.getTotalPatients()).isEqualTo(1);
        assertThat(statistics.getActiveAdmissions()).isZero();
        assertThat(statistics.getAdmissionsToday()).isEqualTo(1);
        assertThat(statistics.getDischargesToday()).isEqualTo(1);
        assertThat(statistics.getLastSevenDays()).hasSize(7);
    }

    @Test
    void listsAdmissionsActivityAndCliniciansForAdminToken() throws Exception {
        openAdmission(LocalDate.now());

        mockMvc.perform(get("/api/admissions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].department").value("Reparto dimostrativo"));

        mockMvc.perform(get("/api/patients/statistics/activity")
                        .param("from", LocalDate.now().toString())
                        .param("to", LocalDate.now().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].admissions").value(1));

        mockMvc.perform(get("/api/clinicians")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Dott.ssa Elena Conti"));
    }

    @Test
    void rejectsDeletingPatientWithAdmissionHistory() {
        PatientResponse patient = patientService.create(patientRequest("RSSMRA80A01H501U"));
        admissionService.open(patient.getId(), admissionRequest(LocalDate.now()));

        assertThatThrownBy(() -> patientService.delete(patient.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code")
                .isEqualTo("PATIENT_HAS_ADMISSIONS");
    }

    @Test
    void deletesPatientWithoutAdmissions() {
        PatientResponse patient = patientService.create(patientRequest("RSSMRA80A01H501U"));

        patientService.delete(patient.getId());

        assertThatThrownBy(() -> patientService.findById(patient.getId()))
                .isInstanceOf(ResourceNotFoundException.class)
                .extracting("code")
                .isEqualTo("PATIENT_NOT_FOUND");
    }

    @Test
    void deletesAdmission() throws Exception {
        AdmissionResponse admission = openAdmission(LocalDate.now());

        mockMvc.perform(delete("/api/admissions/" + admission.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken()))
                .andExpect(status().isNoContent());

        assertThatThrownBy(() -> admissionService.findById(admission.getId()))
                .isInstanceOf(ResourceNotFoundException.class)
                .extracting("code")
                .isEqualTo("ADMISSION_NOT_FOUND");
    }

    private AdmissionResponse openAdmission(LocalDate admissionDate) {
        PatientResponse patient = patientService.create(patientRequest("RSSMRA80A01H501U"));
        return admissionService.open(patient.getId(), admissionRequest(admissionDate));
    }

    private CreatePatientRequest patientRequest(String fiscalCode) {
        CreatePatientRequest request = new CreatePatientRequest();
        request.setFirstName("Paziente");
        request.setLastName("Dimostrativo");
        request.setFiscalCode(fiscalCode);
        request.setBirthDate(LocalDate.of(1980, 1, 1));
        request.setEmail("patient@example.local");
        request.setPhone("+39 010 0000000");
        return request;
    }

    private CreateAdmissionRequest admissionRequest(LocalDate admissionDate) {
        CreateAdmissionRequest request = new CreateAdmissionRequest();
        request.setAdmissionDate(admissionDate);
        request.setDepartment("Reparto dimostrativo");
        request.setNotes("Dati sintetici per test");
        return request;
    }

    private DischargeAdmissionRequest dischargeRequest(LocalDate dischargeDate) {
        DischargeAdmissionRequest request = new DischargeAdmissionRequest();
        request.setDischargeDate(dischargeDate);
        return request;
    }

    private String adminToken() {
        long expiration = System.currentTimeMillis() / 1000 + 600;
        String claims = "{"
                + "\"user_name\":\"admin@test.local\","
                + "\"client_id\":\"test-client\","
                + "\"scope\":[\"read\",\"write\"],"
                + "\"authorities\":[\"ROLE_ADMIN\"],"
                + "\"aud\":[\"platform-api\"],"
                + "\"exp\":" + expiration
                + "}";
        return JwtHelper.encode(claims, new MacSigner(SIGNING_KEY)).getEncoded();
    }
}
