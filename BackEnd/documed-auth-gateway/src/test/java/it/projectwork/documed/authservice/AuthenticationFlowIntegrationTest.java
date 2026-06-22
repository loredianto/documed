package it.projectwork.documed.authservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.netflix.zuul.filters.ZuulProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.jwt.JwtHelper;
import org.springframework.security.jwt.crypto.sign.MacSigner;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import it.projectwork.documed.authservice.domain.AuthClientDetails;
import it.projectwork.documed.authservice.domain.User;
import it.projectwork.documed.authservice.repository.AuthClientRepository;
import it.projectwork.documed.authservice.repository.UserRepository;
import it.projectwork.documed.authservice.util.Authorities;

/**
 * Verifies the complete local security flow against an in-memory relational database.
 */
@SpringBootTest(properties = {
        "security.jwt.signing-key=test-jwt-signing-key-with-more-than-32-characters",
        "security.cors.allowed-origins=http://localhost:3000",
        "spring.datasource.url=jdbc:h2:mem:auth_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.default_schema=PUBLIC",
        "spring.flyway.enabled=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationFlowIntegrationTest {

    private static final String USERNAME = "admin@test.local";
    private static final String PASSWORD = "TestPassword123!";
    private static final String CLIENT_ID = "test-client";
    private static final String CLIENT_SECRET = "TestClientSecret123!";
    private static final String SIGNING_KEY = "test-jwt-signing-key-with-more-than-32-characters";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ZuulProperties zuulProperties;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthClientRepository clientRepository;

    @BeforeEach
    void configureSecurityData() {
        clientRepository.deleteAll();
        userRepository.deleteAll();

        User admin = new User(USERNAME, passwordEncoder.encode(PASSWORD));
        admin.setActivated(true);
        admin.setAuthorities(Collections.singleton(Authorities.ROLE_ADMIN));
        userRepository.save(admin);

        AuthClientDetails client = new AuthClientDetails();
        client.setClientId(CLIENT_ID);
        client.setClientSecret(passwordEncoder.encode(CLIENT_SECRET));
        client.setGrantTypes("password,refresh_token");
        client.setScopes("read,write");
        client.setResources("platform-api");
        client.setAccessTokenValidity(900);
        client.setRefreshTokenValidity(3600);
        clientRepository.save(client);
    }

    @Test
    void validLoginReturnsSignedAdminJwt() throws Exception {
        String token = login(PASSWORD);

        assertThat(token.split("\\.")).hasSize(3);
        String claimsJson = JwtHelper.decodeAndVerify(token, new MacSigner(SIGNING_KEY)).getClaims();
        JsonNode claims = objectMapper.readTree(claimsJson);
        assertThat(claims.get("user_name").asText()).isEqualTo(USERNAME);
        assertThat(claims.get("authorities").toString()).contains("ROLE_ADMIN");
    }

    @Test
    void invalidLoginIsRejected() throws Exception {
        mockMvc.perform(post("/oauth/token")
                        .with(httpBasic(CLIENT_ID, CLIENT_SECRET))
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "password")
                        .param("username", USERNAME)
                        .param("password", "wrong-password"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_grant"));
    }

    @Test
    void protectedEndpointsRequireValidAdminToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        String token = login(PASSWORD);
        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(USERNAME))
                .andExpect(jsonPath("$.authorities[0]").value("ROLE_ADMIN"));
        mockMvc.perform(post("/api/auth/logout").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void configuredOriginCanCallGateway() throws Exception {
        mockMvc.perform(options("/api/auth/me")
                        .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000"));
    }

    @Test
    void documentAdmissionRoutePrecedesGenericAdmissionRoute() {
        List<String> routeIds = new ArrayList<>(zuulProperties.getRoutes().keySet());

        assertThat(zuulProperties.getRoutes().get("admission-documents").getPath())
                .isEqualTo("/api/admissions/*/documents/**");
        assertThat(zuulProperties.getRoutes().get("patient-admissions").getPath())
                .isEqualTo("/api/admissions/**");
        assertThat(routeIds.indexOf("admission-documents"))
                .isLessThan(routeIds.indexOf("patient-admissions"));
    }

    private String login(String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/oauth/token")
                        .with(httpBasic(CLIENT_ID, CLIENT_SECRET))
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("grant_type", "password")
                        .param("username", USERNAME)
                        .param("password", password))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token_type").value("bearer"))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("access_token").asText();
    }
}
