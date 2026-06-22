package it.projectwork.documed.authservice.domain;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.provider.ClientDetails;

/**
 * OAuth2 client persisted in PostgreSQL and consumed by the existing
 * authorization server.
 */
@Entity
@Table(name = "oauth_clients")
public class AuthClientDetails implements ClientDetails {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", nullable = false, unique = true, length = 100)
    private String clientId;

    @Column(name = "client_secret", nullable = false, length = 100)
    private String clientSecret;

    @Column(name = "grant_types", nullable = false, length = 255)
    private String grantTypes;

    @Column(nullable = false, length = 255)
    private String scopes;

    @Column(nullable = false, length = 255)
    private String resources;

    @Column(name = "redirect_uris", length = 1000)
    private String redirectUris;

    @Column(name = "access_token_validity", nullable = false)
    private Integer accessTokenValidity;

    @Column(name = "refresh_token_validity", nullable = false)
    private Integer refreshTokenValidity;

    @Column(name = "additional_information", columnDefinition = "TEXT")
    private String additionalInformation;

    @Override
    public String getClientId() {
        return clientId;
    }

    @Override
    public Set<String> getResourceIds() {
        return resources != null ? new HashSet<>(Arrays.asList(resources.split(","))) : null;
    }

    @Override
    public boolean isSecretRequired() {
        return true;
    }

    @Override
    public String getClientSecret() {
        return clientSecret;
    }

    @Override
    public boolean isScoped() {
        return scopes != null && !scopes.isBlank();
    }

    @Override
    public Set<String> getScope() {
        return scopes != null ? new HashSet<>(Arrays.asList(scopes.split(","))) : null;
    }

    @Override
    public Set<String> getAuthorizedGrantTypes() {
        return grantTypes != null ? new HashSet<>(Arrays.asList(grantTypes.split(","))) : null;
    }

    @Override
    public Set<String> getRegisteredRedirectUri() {
        return redirectUris != null ? new HashSet<>(Arrays.asList(redirectUris.split(","))) : null;
    }

    @Override
    public Collection<GrantedAuthority> getAuthorities() {
        return new ArrayList<>();
    }

    @Override
    public Integer getAccessTokenValiditySeconds() {
        return accessTokenValidity;
    }

    @Override
    public Integer getRefreshTokenValiditySeconds() {
        return refreshTokenValidity;
    }

    @Override
    public boolean isAutoApprove(String scope) {
        return true;
    }

    @Override
    public Map<String, Object> getAdditionalInformation() {
        return null;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public void setGrantTypes(String grantTypes) {
        this.grantTypes = grantTypes;
    }

    public void setScopes(String scopes) {
        this.scopes = scopes;
    }

    public void setResources(String resources) {
        this.resources = resources;
    }

    public void setRedirectUris(String redirectUris) {
        this.redirectUris = redirectUris;
    }

    public void setAccessTokenValidity(Integer accessTokenValidity) {
        this.accessTokenValidity = accessTokenValidity;
    }

    public void setRefreshTokenValidity(Integer refreshTokenValidity) {
        this.refreshTokenValidity = refreshTokenValidity;
    }

    public void setAdditionalInformation(String additionalInformation) {
        this.additionalInformation = additionalInformation;
    }
}
