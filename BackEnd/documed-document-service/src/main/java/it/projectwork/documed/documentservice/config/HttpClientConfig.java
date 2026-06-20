package it.projectwork.documed.documentservice.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.client.RestTemplate;

/**
 * Configures the small synchronous client used to validate admissions.
 */
@Configuration
public class HttpClientConfig {

    @Bean
    @Qualifier("patientRestTemplate")
    public RestTemplate patientRestTemplate(RestTemplateBuilder builder,
            @Value("${clients.patient-service.connect-timeout-millis}") long connectTimeoutMillis,
            @Value("${clients.patient-service.read-timeout-millis}") long readTimeoutMillis) {
        return builder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMillis))
                .setReadTimeout(Duration.ofMillis(readTimeoutMillis))
                .build();
    }

    @Bean
    @Qualifier("ocrRestTemplate")
    public RestTemplate ocrRestTemplate(RestTemplateBuilder builder,
            @Value("${clients.ocr-service.connect-timeout-millis}") long connectTimeoutMillis,
            @Value("${clients.ocr-service.read-timeout-millis}") long readTimeoutMillis) {
        return builder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMillis))
                .setReadTimeout(Duration.ofMillis(readTimeoutMillis))
                .build();
    }
}
