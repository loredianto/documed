package it.projectwork.documed.ocrservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import it.projectwork.documed.ocrservice.dto.OcrExtractResponse;
import it.projectwork.documed.ocrservice.error.OcrProcessingException;
import it.projectwork.documed.ocrservice.service.OcrService;
import it.projectwork.documed.ocrservice.service.TesseractEngine;

/**
 * Verifies OCR validation, success/failure behavior and temporary-file cleanup.
 */
@ExtendWith(MockitoExtension.class)
class OcrServiceTest {

    @Mock
    private TesseractEngine tesseractEngine;

    private OcrService ocrService;

    @BeforeEach
    void setUp() {
        ocrService = new OcrService(tesseractEngine, 1024);
    }

    @Test
    void returnsExtractedTextAndDeletesTemporaryInput() {
        when(tesseractEngine.getLanguage()).thenReturn("ita");
        AtomicReference<Path> temporaryPath = new AtomicReference<>();
        when(tesseractEngine.extract(any(Path.class))).thenAnswer(invocation -> {
            Path path = invocation.getArgument(0);
            temporaryPath.set(path);
            assertThat(Files.exists(path)).isTrue();
            return "Documento sintetico";
        });

        OcrExtractResponse response = ocrService.extract(validPng());

        assertThat(response.getText()).isEqualTo("Documento sintetico");
        assertThat(response.getLanguage()).isEqualTo("ita");
        assertThat(response.getProcessingTimeMs()).isGreaterThanOrEqualTo(0);
        assertThat(Files.exists(temporaryPath.get())).isFalse();
    }

    @Test
    void propagatesOcrFailureAndDeletesTemporaryInput() {
        when(tesseractEngine.getLanguage()).thenReturn("ita");
        AtomicReference<Path> temporaryPath = new AtomicReference<>();
        when(tesseractEngine.extract(any(Path.class))).thenAnswer(invocation -> {
            temporaryPath.set(invocation.getArgument(0));
            throw new OcrProcessingException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "OCR_NO_TEXT_DETECTED",
                    "Nessun testo leggibile rilevato");
        });

        assertThatThrownBy(() -> ocrService.extract(validPng()))
                .isInstanceOf(OcrProcessingException.class)
                .extracting("code")
                .isEqualTo("OCR_NO_TEXT_DETECTED");
        assertThat(Files.exists(temporaryPath.get())).isFalse();
    }

    @Test
    void rejectsUnsupportedPdf() {
        MockMultipartFile pdf = new MockMultipartFile(
                "file", "sample.pdf", "application/pdf", "%PDF-1.4".getBytes());

        assertThatThrownBy(() -> ocrService.extract(pdf))
                .isInstanceOf(OcrProcessingException.class)
                .satisfies(exception -> {
                    OcrProcessingException ocrException = (OcrProcessingException) exception;
                    assertThat(ocrException.getStatus()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
                    assertThat(ocrException.getCode()).isEqualTo("UNSUPPORTED_MEDIA_TYPE");
                });
        verify(tesseractEngine, never()).extract(any(Path.class));
    }

    @Test
    void rejectsEmptyFile() {
        MockMultipartFile empty = new MockMultipartFile(
                "file", "empty.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> ocrService.extract(empty))
                .isInstanceOf(OcrProcessingException.class)
                .extracting("code")
                .isEqualTo("EMPTY_FILE");
    }

    @Test
    void rejectsInvalidImageSignature() {
        MockMultipartFile invalid = new MockMultipartFile(
                "file", "fake.png", "image/png", "not-a-png".getBytes());

        assertThatThrownBy(() -> ocrService.extract(invalid))
                .isInstanceOf(OcrProcessingException.class)
                .extracting("code")
                .isEqualTo("FILE_CONTENT_TYPE_MISMATCH");
    }

    private MockMultipartFile validPng() {
        return new MockMultipartFile(
                "file",
                "sample.png",
                "image/png",
                new byte[] {
                        (byte) 0x89, 0x50, 0x4E, 0x47,
                        0x0D, 0x0A, 0x1A, 0x0A,
                        0x00, 0x00, 0x00, 0x00
                });
    }
}
