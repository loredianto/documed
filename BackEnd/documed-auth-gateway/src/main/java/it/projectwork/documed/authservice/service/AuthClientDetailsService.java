package it.projectwork.documed.authservice.service;

import org.springframework.security.oauth2.provider.ClientDetails;
import org.springframework.security.oauth2.provider.ClientDetailsService;
import org.springframework.security.oauth2.provider.NoSuchClientException;
import org.springframework.stereotype.Service;

import it.projectwork.documed.authservice.repository.AuthClientRepository;

/**
 * Resolves OAuth2 client configuration exclusively from PostgreSQL.
 */
@Service
public class AuthClientDetailsService implements ClientDetailsService {
    private final AuthClientRepository authClientRepository;

    public AuthClientDetailsService(AuthClientRepository authClientRepository) {
        this.authClientRepository = authClientRepository;
    }

    @Override
    public ClientDetails loadClientByClientId(String clientId) {
        return authClientRepository.findByClientId(clientId)
                .orElseThrow(() -> new NoSuchClientException("OAuth2 client not found"));
    }
}
