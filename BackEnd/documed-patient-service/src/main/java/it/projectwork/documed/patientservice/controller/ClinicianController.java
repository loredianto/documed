package it.projectwork.documed.patientservice.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import it.projectwork.documed.patientservice.dto.ClinicianResponse;
import it.projectwork.documed.patientservice.service.ClinicianService;

/**
 * Read-only lookup endpoint for clinicians referenced by structured OCR data.
 */
@RestController
@RequestMapping("/api/clinicians")
@Api(tags = "Clinicians")
public class ClinicianController {

    private final ClinicianService clinicianService;

    public ClinicianController(ClinicianService clinicianService) {
        this.clinicianService = clinicianService;
    }

    @GetMapping
    @ApiOperation("Lists clinicians available as signing doctors")
    public List<ClinicianResponse> findAll() {
        return clinicianService.findAll();
    }
}
