package it.projectwork.documed.authservice.controller;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.ApiOperation;
import it.projectwork.documed.authservice.domain.UserDto;
import it.projectwork.documed.authservice.util.Authorities;

/**
 * Authenticated administrator endpoints exposed by the gateway.
 *
 * <p>Token creation remains on the standard OAuth2 endpoint
 * {@code POST /oauth/token}. User provisioning is performed directly in
 * MongoDB and is not exposed as a public API.</p>
 */
@RestController
@RequestMapping("/api/auth")
public class UserController {

    /**
     * Returns the identity reconstructed from the verified JWT.
     *
     * @param authentication verified OAuth2 authentication
     * @return authenticated administrator data without credentials
     */
    @GetMapping("/me")
    @ApiOperation("Returns the authenticated administrator")
    public UserDto currentUser(Authentication authentication) {
        Set<Authorities> authorities = authentication.getAuthorities().stream()
                .filter(authority -> Authorities.ROLE_ADMIN.name().equals(authority.getAuthority()))
                .map(authority -> Authorities.valueOf(authority.getAuthority()))
                .collect(Collectors.toSet());
        return new UserDto(authentication.getName(), authorities);
    }

    /**
     * Completes client-side logout.
     *
     * <p>JWTs are stateless and remain cryptographically valid until expiry.
     * The caller must discard access and refresh tokens. A server-side blacklist
     * is deliberately omitted to keep this single-admin flow simple.</p>
     */
    @PostMapping("/logout")
    @ApiOperation("Confirms client-side logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
