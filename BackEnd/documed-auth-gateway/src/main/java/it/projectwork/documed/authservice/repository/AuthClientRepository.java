package it.projectwork.documed.authservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import it.projectwork.documed.authservice.domain.AuthClientDetails;

@Repository
public interface AuthClientRepository extends JpaRepository<AuthClientDetails, Long> {
    Optional<AuthClientDetails> findByClientId(String clientId);
}
