package it.projectwork.documed.ocrservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * Starts the internal synchronous Tesseract OCR service.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class OcrServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OcrServiceApplication.class, args);
    }
}
