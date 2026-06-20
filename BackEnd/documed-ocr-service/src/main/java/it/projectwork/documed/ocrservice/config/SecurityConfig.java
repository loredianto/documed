package it.projectwork.documed.ocrservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableResourceServer;
import org.springframework.security.oauth2.config.annotation.web.configuration.ResourceServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configurers.ResourceServerSecurityConfigurer;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;
import org.springframework.security.oauth2.provider.token.store.JwtTokenStore;

/**
 * Restricts internal OCR execution to authenticated Documed administrators.
 */
@Configuration
@EnableResourceServer
public class SecurityConfig extends ResourceServerConfigurerAdapter {

    private final String signingKey;
    private final SecurityErrorHandler securityErrorHandler;

    public SecurityConfig(@Value("${security.jwt.signing-key}") String signingKey,
            SecurityErrorHandler securityErrorHandler) {
        if (signingKey == null || signingKey.length() < 32) {
            throw new IllegalStateException("JWT_SIGNING_KEY must contain at least 32 characters");
        }
        this.signingKey = signingKey;
        this.securityErrorHandler = securityErrorHandler;
    }

    @Bean
    public JwtAccessTokenConverter jwtAccessTokenConverter() {
        JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
        converter.setSigningKey(signingKey);
        return converter;
    }

    @Bean
    public TokenStore tokenStore() {
        return new JwtTokenStore(jwtAccessTokenConverter());
    }

    @Override
    public void configure(ResourceServerSecurityConfigurer resources) {
        resources.resourceId("platform-api")
                .tokenStore(tokenStore())
                .stateless(true)
                .authenticationEntryPoint(securityErrorHandler)
                .accessDeniedHandler(securityErrorHandler);
    }

    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.csrf().disable()
                .authorizeRequests()
                .antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .antMatchers(
                        "/v2/api-docs",
                        "/swagger-ui.html",
                        "/swagger-resources/**",
                        "/webjars/**"
                ).permitAll()
                .antMatchers("/internal/**").hasRole("ADMIN")
                .anyRequest().denyAll()
                .and().exceptionHandling()
                .authenticationEntryPoint(securityErrorHandler)
                .accessDeniedHandler(securityErrorHandler);
    }
}
