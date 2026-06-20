package it.projectwork.documed.documentservice.client;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import it.projectwork.documed.documentservice.error.BusinessRuleException;
import it.projectwork.documed.documentservice.error.IntegrationException;

/**
 * Synchronous multipart client for the internal OCR Service.
 */
@Component
public class OcrServiceClient {

    private final RestTemplate restTemplate;
    private final String ocrServiceBaseUrl;

    public OcrServiceClient(
            @Qualifier("ocrRestTemplate") RestTemplate restTemplate,
            @Value("${clients.ocr-service.base-url}") String ocrServiceBaseUrl) {
        this.restTemplate = restTemplate;
        this.ocrServiceBaseUrl = removeTrailingSlash(ocrServiceBaseUrl);
    }

    /**
     * Sends GridFS bytes without persisting another file in Document Service.
     */
    public OcrClientResponse extract(byte[] content, String filename, String contentType,
            String authorizationHeader) {
        ByteArrayResource resource = new ByteArrayResource(content) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.parseMediaType(contentType));
        fileHeaders.setContentDispositionFormData("file", filename);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new HttpEntity<>(resource, fileHeaders));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);

        try {
            ResponseEntity<OcrClientResponse> response = restTemplate.exchange(
                    ocrServiceBaseUrl + "/internal/ocr/extract",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    OcrClientResponse.class);
            OcrClientResponse result = response.getBody();
            if (result == null || !StringUtils.hasText(result.getText())) {
                throw new IntegrationException(
                        "OCR_SERVICE_INVALID_RESPONSE",
                        "OCR Service ha restituito una risposta non valida");
            }
            return result;
        } catch (HttpClientErrorException exception) {
            if (exception.getStatusCode() == org.springframework.http.HttpStatus.UNSUPPORTED_MEDIA_TYPE) {
                throw new BusinessRuleException(
                        org.springframework.http.HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "OCR_UNSUPPORTED_MEDIA_TYPE",
                        "OCR disponibile solo per immagini PNG e JPEG");
            }
            throw new IntegrationException(
                    "OCR_SERVICE_REQUEST_REJECTED",
                    "OCR Service non ha elaborato il documento",
                    exception);
        } catch (ResourceAccessException exception) {
            throw new IntegrationException(
                    "OCR_SERVICE_UNAVAILABLE",
                    "OCR Service non disponibile",
                    exception);
        } catch (RestClientException exception) {
            throw new IntegrationException(
                    "OCR_SERVICE_ERROR",
                    "Errore durante la comunicazione con OCR Service",
                    exception);
        }
    }

    private String removeTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
