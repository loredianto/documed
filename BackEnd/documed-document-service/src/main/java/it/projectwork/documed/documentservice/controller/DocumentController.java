package it.projectwork.documed.documentservice.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.validation.Valid;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import it.projectwork.documed.documentservice.dto.DocumentContentResponse;
import it.projectwork.documed.documentservice.dto.DocumentResponse;
import it.projectwork.documed.documentservice.dto.DocumentSearchCriteria;
import it.projectwork.documed.documentservice.dto.DocumentStatisticsResponse;
import it.projectwork.documed.documentservice.dto.FileInRecordResponse;
import it.projectwork.documed.documentservice.service.DocumentService;

/**
 * Metadata, download, deletion, search and statistics endpoints.
 */
@RestController
@RequestMapping("/api/documents")
@Validated
@Api(tags = "Documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    @ApiOperation("Lists all document metadata")
    public List<DocumentResponse> findAll() {
        return documentService.findAll();
    }

    @GetMapping("/{documentId}")
    @ApiOperation("Returns document metadata")
    public DocumentResponse findById(@PathVariable String documentId) {
        return documentService.findById(documentId);
    }

    @GetMapping("/{documentId}/content")
    @ApiOperation("Downloads document binary content")
    public ResponseEntity<byte[]> download(@PathVariable String documentId) {
        DocumentContentResponse document = documentService.download(documentId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(document.getContentType()));
        headers.setContentLength(document.getContent().length);
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename(document.getOriginalFilename(), StandardCharsets.UTF_8)
                .build());
        return ResponseEntity.ok().headers(headers).body(document.getContent());
    }

    @DeleteMapping("/{documentId}")
    @ApiOperation("Deletes metadata and GridFS content")
    public ResponseEntity<Void> delete(@PathVariable String documentId) {
        documentService.delete(documentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{documentId}/file-in-record")
    @ApiOperation("Marks a digital document as filed in the admission record")
    public FileInRecordResponse fileInRecord(@PathVariable String documentId) {
        documentService.fileInRecord(documentId);
        return new FileInRecordResponse(documentId, true);
    }

    @GetMapping("/search")
    @ApiOperation("Searches document text and metadata")
    public List<DocumentResponse> search(
            @Valid @ModelAttribute DocumentSearchCriteria criteria) {
        return documentService.search(criteria);
    }

    @GetMapping("/statistics")
    @ApiOperation("Returns document and OCR status counters")
    public DocumentStatisticsResponse statistics() {
        return documentService.statistics();
    }
}
