package it.projectwork.documed.ocrservice.controller;

import javax.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import it.projectwork.documed.ocrservice.dto.OcrExtractRequest;
import it.projectwork.documed.ocrservice.dto.OcrExtractResponse;
import it.projectwork.documed.ocrservice.service.OcrService;

/**
 * Internal synchronous OCR extraction endpoint.
 */
@RestController
@RequestMapping("/internal/ocr")
@Validated
@Api(tags = "Internal OCR")
public class OcrController {

    private final OcrService ocrService;

    public OcrController(OcrService ocrService) {
        this.ocrService = ocrService;
    }

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ApiOperation("Extracts Italian text from a PNG or JPEG image")
    public OcrExtractResponse extract(@Valid @ModelAttribute OcrExtractRequest request) {
        return ocrService.extract(request.getFile());
    }
}
