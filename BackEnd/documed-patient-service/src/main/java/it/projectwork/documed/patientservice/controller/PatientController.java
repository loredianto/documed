package it.projectwork.documed.patientservice.controller;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

import javax.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import it.projectwork.documed.patientservice.dto.AdmissionResponse;
import it.projectwork.documed.patientservice.dto.CreateAdmissionRequest;
import it.projectwork.documed.patientservice.dto.CreatePatientRequest;
import it.projectwork.documed.patientservice.dto.DailyAdmissionStatisticsResponse;
import it.projectwork.documed.patientservice.dto.PatientResponse;
import it.projectwork.documed.patientservice.dto.PatientStatisticsResponse;
import it.projectwork.documed.patientservice.dto.UpdatePatientRequest;
import it.projectwork.documed.patientservice.service.AdmissionService;
import it.projectwork.documed.patientservice.service.PatientService;

/**
 * REST endpoints for the patient registry and patient admission history.
 */
@RestController
@RequestMapping("/api/patients")
@Api(tags = "Patients")
public class PatientController {

    private final PatientService patientService;
    private final AdmissionService admissionService;

    public PatientController(PatientService patientService, AdmissionService admissionService) {
        this.patientService = patientService;
        this.admissionService = admissionService;
    }

    @PostMapping
    @ApiOperation("Registers a patient")
    public ResponseEntity<PatientResponse> create(@Valid @RequestBody CreatePatientRequest request) {
        PatientResponse patient = patientService.create(request);
        return ResponseEntity.created(URI.create("/api/patients/" + patient.getId())).body(patient);
    }

    @GetMapping
    @ApiOperation("Lists all patients ordered by name")
    public List<PatientResponse> findAll() {
        return patientService.findAll();
    }

    @GetMapping("/{patientId}")
    @ApiOperation("Returns one patient")
    public PatientResponse findById(@PathVariable Long patientId) {
        return patientService.findById(patientId);
    }

    @PutMapping("/{patientId}")
    @ApiOperation("Updates one patient")
    public PatientResponse update(@PathVariable Long patientId,
            @Valid @RequestBody UpdatePatientRequest request) {
        return patientService.update(patientId, request);
    }

    @DeleteMapping("/{patientId}")
    @ApiOperation("Deletes a patient without admission history")
    public ResponseEntity<Void> delete(@PathVariable Long patientId) {
        patientService.delete(patientId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{patientId}/admissions")
    @ApiOperation("Opens an admission for one patient")
    public ResponseEntity<AdmissionResponse> openAdmission(@PathVariable Long patientId,
            @Valid @RequestBody CreateAdmissionRequest request) {
        AdmissionResponse admission = admissionService.open(patientId, request);
        return ResponseEntity.created(URI.create("/api/admissions/" + admission.getId())).body(admission);
    }

    @GetMapping("/{patientId}/admissions")
    @ApiOperation("Returns the admission history for one patient")
    public List<AdmissionResponse> findAdmissions(@PathVariable Long patientId) {
        return admissionService.findByPatient(patientId);
    }

    @GetMapping("/statistics")
    @ApiOperation("Returns patient and admission dashboard statistics")
    public PatientStatisticsResponse statistics() {
        return admissionService.statistics();
    }

    @GetMapping("/statistics/activity")
    @ApiOperation("Returns admission and discharge counters for an inclusive date range")
    public List<DailyAdmissionStatisticsResponse> activity(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return admissionService.activity(from, to);
    }
}
