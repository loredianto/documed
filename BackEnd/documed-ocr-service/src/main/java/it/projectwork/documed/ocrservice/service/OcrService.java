package it.projectwork.documed.ocrservice.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import it.projectwork.documed.ocrservice.dto.OcrExtractResponse;
import it.projectwork.documed.ocrservice.error.OcrProcessingException;

/**
 * Validates an image, manages its temporary file and delegates extraction to
 * the Tesseract process boundary.
 */
@Service
public class OcrService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OcrService.class);

    private static final String PNG = "image/png";
    private static final String JPEG = "image/jpeg";
    private static final Set<String> SUPPORTED_TYPES = Set.of(PNG, JPEG);

    private static final byte[] PNG_SIGNATURE = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };
    private static final byte[] JPEG_SIGNATURE = new byte[] {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF
    };

    private final TesseractEngine tesseractEngine;
    private final long maxFileSizeBytes;

    public OcrService(TesseractEngine tesseractEngine,
            @Value("${ocr.max-file-size-bytes}") long maxFileSizeBytes) {
        if (maxFileSizeBytes <= 0) {
            throw new IllegalStateException("OCR_MAX_FILE_SIZE_BYTES must be positive");
        }
        this.tesseractEngine = tesseractEngine;
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    /**
     * Extracts text synchronously and always removes the temporary input file.
     */
    public OcrExtractResponse extract(MultipartFile file) {
        long startedAt = System.nanoTime();
        ValidatedImage image = validateAndRead(file);
        Path temporaryInput = null;
        try {
            temporaryInput = Files.createTempFile("documed-ocr-", image.suffix);
            Files.write(temporaryInput, image.content);
            LOGGER.info("OCR started: contentType={}, fileSize={}, language={}",
                    image.contentType, image.content.length, tesseractEngine.getLanguage());

            String text = tesseractEngine.extract(temporaryInput);
            long processingTimeMs = elapsedMillis(startedAt);
            LOGGER.info("OCR completed: fileSize={}, processingTimeMs={}",
                    image.content.length, processingTimeMs);
            return new OcrExtractResponse(
                    text, tesseractEngine.getLanguage(), processingTimeMs);
        } catch (OcrProcessingException exception) {
            LOGGER.warn("OCR failed: code={}, fileSize={}, processingTimeMs={}",
                    exception.getCode(), image.content.length, elapsedMillis(startedAt));
            throw exception;
        } catch (IOException exception) {
            throw new OcrProcessingException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "OCR_TEMPORARY_FILE_ERROR",
                    "Impossibile gestire il file temporaneo OCR",
                    exception);
        } finally {
            deleteTemporaryInput(temporaryInput);
        }
    }

    private ValidatedImage validateAndRead(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new OcrProcessingException(
                    HttpStatus.BAD_REQUEST, "EMPTY_FILE", "Il file non può essere vuoto");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new OcrProcessingException(
                    HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE",
                    "Il file supera la dimensione massima consentita");
        }

        String contentType = normalizeContentType(file.getContentType());
        if (!SUPPORTED_TYPES.contains(contentType)) {
            throw new OcrProcessingException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE",
                    "OCR supportato solo per immagini PNG e JPEG");
        }

        try {
            byte[] content = file.getBytes();
            if (!signatureMatches(contentType, content)) {
                throw new OcrProcessingException(
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE, "FILE_CONTENT_TYPE_MISMATCH",
                        "Il contenuto non corrisponde al MIME type dichiarato");
            }
            return new ValidatedImage(
                    content,
                    contentType,
                    PNG.equals(contentType) ? ".png" : ".jpg");
        } catch (IOException exception) {
            throw new OcrProcessingException(
                    HttpStatus.BAD_REQUEST,
                    "OCR_FILE_READ_ERROR",
                    "Impossibile leggere il file ricevuto",
                    exception);
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        int parameterStart = contentType.indexOf(';');
        String value = parameterStart >= 0
                ? contentType.substring(0, parameterStart)
                : contentType;
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean signatureMatches(String contentType, byte[] content) {
        byte[] signature = PNG.equals(contentType) ? PNG_SIGNATURE : JPEG_SIGNATURE;
        return content.length >= signature.length
                && Arrays.equals(Arrays.copyOf(content, signature.length), signature);
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }

    private void deleteTemporaryInput(Path path) {
        if (path == null) {
            return;
        }
        try {
            Files.deleteIfExists(path);
        } catch (IOException exception) {
            LOGGER.warn("Unable to delete OCR temporary input: {}", path);
        }
    }

    private static final class ValidatedImage {
        private final byte[] content;
        private final String contentType;
        private final String suffix;

        private ValidatedImage(byte[] content, String contentType, String suffix) {
            this.content = content;
            this.contentType = contentType;
            this.suffix = suffix;
        }
    }
}
