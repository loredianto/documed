package it.projectwork.documed.documentservice.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import it.projectwork.documed.documentservice.dto.DocumentOcrResponse;
import it.projectwork.documed.documentservice.service.DocumentOcrService;

/**
 * Starts OCR synchronously and exposes the stored OCR result.
 */
@RestController
@RequestMapping("/api/documents/{documentId}/ocr")
@Api(tags = "Document OCR")
public class DocumentOcrController {

    private final DocumentOcrService documentOcrService;

    public DocumentOcrController(DocumentOcrService documentOcrService) {
        this.documentOcrService = documentOcrService;
    }

    @PostMapping
    @ApiOperation("Executes or repeats OCR for one stored document")
    public DocumentOcrResponse process(
            @PathVariable String documentId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        return documentOcrService.process(documentId, authorizationHeader);
    }

    @GetMapping
    @ApiOperation("Returns the current OCR state and extracted text")
    public DocumentOcrResponse findResult(@PathVariable String documentId) {
        return documentOcrService.findResult(documentId);
    }
}
