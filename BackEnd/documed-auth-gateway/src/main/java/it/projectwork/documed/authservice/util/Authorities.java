package it.projectwork.documed.authservice.util;

import org.springframework.security.core.GrantedAuthority;

public enum Authorities implements GrantedAuthority {

    ROLE_ADMIN;

    @Override
    public String getAuthority() {
        return name();
    }
    

}
