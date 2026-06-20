package it.projectwork.documed.authservice.domain;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import it.projectwork.documed.authservice.util.Authorities;

/**
 * Safe representation of the authenticated administrator.
 */
public class UserDto implements Serializable {

	private static final long serialVersionUID = 1L;

	private String username;
	private Set<Authorities> authorities = new HashSet<>();

	public UserDto() {
	}

	public UserDto(String username, Set<Authorities> authorities) {
		this.username = username;
		this.authorities = authorities;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public Set<Authorities> getAuthorities() {
		return authorities;
	}

	public void setAuthorities(Set<Authorities> authorities) {
		this.authorities = authorities;
	}

}
