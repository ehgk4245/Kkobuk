package site.kkobuk.server.domain.member.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import site.kkobuk.server.domain.member.entity.SocialAccount;

import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {

    @EntityGraph(attributePaths = {"member"})
    Optional<SocialAccount> findByProviderAndProviderId(String provider, String providerId);
}