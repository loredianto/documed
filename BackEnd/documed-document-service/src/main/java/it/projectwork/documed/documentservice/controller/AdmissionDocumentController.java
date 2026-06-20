package it.projectwork.documed.documentservice.controller;

import java.net.URI;
import java.util.List;

import javax.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import it.projectwork.documed.documentservice.dto.DocumentResponse;
import it.projectwork.documed.documentservice.dto.DocumentUploadRequest;
import it.projectwork.documed.documentservice.service.DocumentService;

/**
 * Upload and listing endpoints scoped to one admission.
 */
@RestController
@RequestMapping("/api/admissions/{admissionId}/documents")
@Validated
@Api(tags = "Admission documents")
public class AdmissionDocumentController {

    private final DocumentService documentService;

    public AdmissionDocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ApiOperation("Uploads a document and associates it with an admission")
    public ResponseEntity<DocumentResponse> upload(
            @PathVariable Long admissionId,
            @Valid @ModelAttribute DocumentUploadRequest request,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        DocumentResponse document = documentService.upload(
                admissionId, request, authorizationHeader);
        return ResponseEntity.created(
                URI.create("/api/documents/" + document.getId())).body(document);
    }

    @GetMapping
    @ApiOperation("Lists documents associated with an admission")
    public List<DocumentResponse> findByAdmission(
            @PathVariable Long admissionId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        return documentService.findByAdmission(admissionId, authorizationHeader);
    }
}
