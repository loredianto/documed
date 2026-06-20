package it.projectwork.documed.ocrservice.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import it.projectwork.documed.ocrservice.error.OcrProcessingException;

/**
 * Executes Tesseract as a bounded external process without JNI bindings.
 */
@Component
public class TesseractEngine {

    private static final Logger LOGGER = LoggerFactory.getLogger(TesseractEngine.class);

    private final String command;
    private final String language;
    private final long timeoutSeconds;

    public TesseractEngine(
            @Value("${ocr.command}") String command,
            @Value("${ocr.language}") String language,
            @Value("${ocr.timeout-seconds}") long timeoutSeconds) {
        if (!StringUtils.hasText(command) || !StringUtils.hasText(language) || timeoutSeconds <= 0) {
            throw new IllegalStateException("Tesseract command, language and timeout must be configured");
        }
        this.command = command;
        this.language = language;
        this.timeoutSeconds = timeoutSeconds;
    }

    /**
     * Runs Tesseract and returns trimmed UTF-8 text. Output and diagnostics are
     * temporary files so large process streams cannot deadlock the JVM.
     */
    public String extract(Path inputFile) {
        String uniqueName = "documed-tesseract-" + UUID.randomUUID();
        Path outputBase = Paths.get(System.getProperty("java.io.tmpdir"), uniqueName);
        Path outputFile = Paths.get(outputBase.toString() + ".txt");
        Path errorFile = Paths.get(outputBase.toString() + ".err");
        Process process = null;
        try {
            ProcessBuilder builder = new ProcessBuilder(
                    command,
                    inputFile.toAbsolutePath().toString(),
                    outputBase.toAbsolutePath().toString(),
                    "-l",
                    language);
            builder.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            builder.redirectError(errorFile.toFile());
            process = builder.start();

            if (!process.waitFor(timeoutSeconds, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                throw new OcrProcessingException(
                        HttpStatus.GATEWAY_TIMEOUT,
                        "OCR_TIMEOUT",
                        "Elaborazione OCR scaduta");
            }
            if (process.exitValue() != 0) {
                LOGGER.warn("Tesseract failed: exitCode={}, diagnostic={}",
                        process.exitValue(), readDiagnostic(errorFile));
                throw new OcrProcessingException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "TESSERACT_PROCESSING_ERROR",
                        "Tesseract non ha elaborato il file");
            }
            if (!Files.exists(outputFile)) {
                throw new OcrProcessingException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "OCR_OUTPUT_MISSING",
                        "Tesseract non ha prodotto un risultato");
            }
            String text = Files.readString(outputFile, StandardCharsets.UTF_8).trim();
            if (!StringUtils.hasText(text)) {
                throw new OcrProcessingException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "OCR_NO_TEXT_DETECTED",
                        "Nessun testo leggibile rilevato");
            }
            return text;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new OcrProcessingException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "OCR_INTERRUPTED",
                    "Elaborazione OCR interrotta",
                    exception);
        } catch (IOException exception) {
            throw new OcrProcessingException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "TESSERACT_EXECUTION_ERROR",
                    "Impossibile eseguire Tesseract",
                    exception);
        } finally {
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
            deleteQuietly(outputFile);
            deleteQuietly(errorFile);
        }
    }

    public String getLanguage() {
        return language;
    }

    private String readDiagnostic(Path errorFile) {
        try {
            if (!Files.exists(errorFile)) {
                return "not available";
            }
            String value = Files.readString(errorFile, StandardCharsets.UTF_8)
                    .replaceAll("[\\r\\n]+", " ")
                    .trim();
            return value.length() > 300 ? value.substring(0, 300) : value;
        } catch (IOException exception) {
            return "not readable";
        }
    }

    private void deleteQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException exception) {
            LOGGER.warn("Unable to delete temporary Tesseract file: {}", path);
        }
    }
}
