package it.projectwork.documed.patientservice.controller;

import javax.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import it.projectwork.documed.patientservice.dto.AdmissionResponse;
import it.projectwork.documed.patientservice.dto.DischargeAdmissionRequest;
import it.projectwork.documed.patientservice.service.AdmissionService;

/**
 * REST endpoints that address admissions independently from their patient.
 */
@RestController
@RequestMapping("/api/admissions")
@Api(tags = "Admissions")
public class AdmissionController {

    private final AdmissionService admissionService;

    public AdmissionController(AdmissionService admissionService) {
        this.admissionService = admissionService;
    }

    @GetMapping("/{admissionId}")
    @ApiOperation("Returns one admission")
    public AdmissionResponse findById(@PathVariable Long admissionId) {
        return admissionService.findById(admissionId);
    }

    @PostMapping("/{admissionId}/discharge")
    @ApiOperation("Discharges an active admission")
    public AdmissionResponse discharge(@PathVariable Long admissionId,
            @Valid @RequestBody DischargeAdmissionRequest request) {
        return admissionService.discharge(admissionId, request);
    }
}
