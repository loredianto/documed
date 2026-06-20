package it.projectwork.documed.documentservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import it.projectwork.documed.documentservice.error.IntegrationException;
import it.projectwork.documed.documentservice.error.ResourceNotFoundException;

/**
 * Explicit HTTP client for the Patient Service admission endpoint.
 */
@Component
public class PatientServiceClient {

    private final RestTemplate restTemplate;
    private final String patientServiceBaseUrl;

    public PatientServiceClient(@Qualifier("patientRestTemplate") RestTemplate restTemplate,
            @Value("${clients.patient-service.base-url}") String patientServiceBaseUrl) {
        this.restTemplate = restTemplate;
        this.patientServiceBaseUrl = removeTrailingSlash(patientServiceBaseUrl);
    }

    /**
     * Loads an admission while propagating the administrator Bearer token.
     */
    public AdmissionClientResponse getAdmission(Long admissionId, String authorizationHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
        try {
            ResponseEntity<AdmissionClientResponse> response = restTemplate.exchange(
                    patientServiceBaseUrl + "/api/admissions/{admissionId}",
                    HttpMethod.GET,
                    new HttpEntity<Void>(headers),
                    AdmissionClientResponse.class,
                    admissionId);
            AdmissionClientResponse admission = response.getBody();
            if (admission == null
                    || admission.getId() == null
                    || !admissionId.equals(admission.getId())
                    || admission.getPatientId() == null) {
                throw new IntegrationException(
                        "PATIENT_SERVICE_INVALID_RESPONSE",
                        "Il Patient Service ha restituito una risposta non valida");
            }
            return admission;
        } catch (HttpClientErrorException.NotFound exception) {
            throw new ResourceNotFoundException("ADMISSION_NOT_FOUND", "Ricovero non trovato");
        } catch (HttpClientErrorException exception) {
            throw new IntegrationException(
                    "PATIENT_SERVICE_REQUEST_REJECTED",
                    "Il Patient Service ha rifiutato la richiesta",
                    exception);
        } catch (ResourceAccessException exception) {
            throw new IntegrationException(
                    "PATIENT_SERVICE_UNAVAILABLE",
                    "Patient Service non disponibile",
                    exception);
        } catch (RestClientException exception) {
            throw new IntegrationException(
                    "PATIENT_SERVICE_ERROR",
                    "Errore durante la comunicazione con il Patient Service",
                    exception);
        }
    }

    private String removeTrailingSlash(String value) {
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }
}
