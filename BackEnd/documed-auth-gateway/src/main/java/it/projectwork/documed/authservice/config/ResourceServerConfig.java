package it.projectwork.documed.authservice.config;

import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableResourceServer;
import org.springframework.security.oauth2.config.annotation.web.configuration.ResourceServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configurers.ResourceServerSecurityConfigurer;
import org.springframework.security.oauth2.provider.token.TokenStore;

/**
 * Protects gateway API routes with the ADMIN authority carried by the JWT.
 */
@Configuration
@EnableResourceServer
public class ResourceServerConfig extends ResourceServerConfigurerAdapter {

	private final TokenStore tokenStore;
	private final SecurityErrorHandler securityErrorHandler;

	public ResourceServerConfig(TokenStore tokenStore, SecurityErrorHandler securityErrorHandler) {
		this.tokenStore = tokenStore;
		this.securityErrorHandler = securityErrorHandler;
	}

	@Override
	public void configure(ResourceServerSecurityConfigurer resources) throws Exception {
		resources.resourceId("platform-api")
				.tokenStore(tokenStore)
				.stateless(true)
				.authenticationEntryPoint(securityErrorHandler);
	}

	@Override
	public void configure(HttpSecurity http) throws Exception {
		http.csrf().disable()
				.authorizeRequests()
				.antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				.antMatchers(
						"/oauth/token",
						"/error",
						"/v2/api-docs",
						"/swagger-ui.html",
						"/swagger-resources/**",
						"/webjars/**"
				).permitAll()
				.antMatchers("/api/**").hasRole("ADMIN")
				.anyRequest().denyAll()
				.and().exceptionHandling()
				.authenticationEntryPoint(securityErrorHandler)
				.accessDeniedHandler(securityErrorHandler);
	}

}
