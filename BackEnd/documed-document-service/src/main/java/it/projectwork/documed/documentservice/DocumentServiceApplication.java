package it.projectwork.documed.documentservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * Starts the Documed service responsible for document metadata and GridFS
 * content.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class DocumentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DocumentServiceApplication.class, args);
    }
}
