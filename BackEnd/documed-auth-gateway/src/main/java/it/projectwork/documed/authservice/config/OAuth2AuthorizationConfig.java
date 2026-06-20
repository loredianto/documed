package it.projectwork.documed.authservice.config;


import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configuration.AuthorizationServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableAuthorizationServer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerSecurityConfigurer;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;
import org.springframework.security.oauth2.provider.token.store.JwtTokenStore;

import it.projectwork.documed.authservice.service.AuthClientDetailsService;
import it.projectwork.documed.authservice.service.CustomUserDetailsService;

/**
 * Retains the existing OAuth2 password flow and signs stateless JWT access
 * tokens for the DocuMed services.
 */
@Configuration
@EnableAuthorizationServer
public class OAuth2AuthorizationConfig extends AuthorizationServerConfigurerAdapter {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final AuthClientDetailsService authClientDetailsService;
    private final PasswordEncoder encoder;
    private final String signingKey;

    public OAuth2AuthorizationConfig(
            @Qualifier("authenticationManagerBean") AuthenticationManager authenticationManager,
            CustomUserDetailsService userDetailsService,
            AuthClientDetailsService authClientDetailsService,
            PasswordEncoder encoder,
            @Value("${security.jwt.signing-key}") String signingKey) {
        if (signingKey == null || signingKey.length() < 32) {
            throw new IllegalStateException("JWT_SIGNING_KEY must contain at least 32 characters");
        }
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.authClientDetailsService = authClientDetailsService;
        this.encoder = encoder;
        this.signingKey = signingKey;
    }

    @Override
    public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
        clients.withClientDetails(authClientDetailsService);
    }

    @Bean
    public TokenStore tokenStore() {
        return new JwtTokenStore(jwtAccessTokenConverter());
    }

    /**
     * Signs and verifies access tokens locally with HMAC SHA-256.
     * The key always comes from external configuration outside local demos.
     */
    @Bean
    public JwtAccessTokenConverter jwtAccessTokenConverter() {
        JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
        converter.setSigningKey(signingKey);
        return converter;
    }

    @Override
    public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
        endpoints
                .tokenStore(tokenStore())
                .tokenEnhancer(jwtAccessTokenConverter())
                .authenticationManager(authenticationManager)
                .userDetailsService(userDetailsService)
                .reuseRefreshTokens(false);
    }

    @Override
    public void configure(AuthorizationServerSecurityConfigurer oauthServer) throws Exception {
        oauthServer
                // A symmetric signing key must never be exposed by /oauth/token_key.
                .tokenKeyAccess("denyAll()")
                .checkTokenAccess("isAuthenticated()")
                .passwordEncoder(encoder)
                .allowFormAuthenticationForClients();
    }

}
