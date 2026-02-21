package site.kkobuk.server.domain.member.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import site.kkobuk.server.global.common.entity.BaseCreatedTimeEntity;

@Entity
@Table(name = "social_accounts", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider", "provider_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SocialAccount extends BaseCreatedTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "provider", nullable = false, updatable = false, length = 20)
    private String provider;

    @Column(name = "provider_id", nullable = false, updatable = false, length = 100)
    private String providerId;

    public static SocialAccount create(Member member, String provider, String providerId) {
        SocialAccount socialAccount = new SocialAccount();
        socialAccount.member = member;
        socialAccount.provider = provider;
        socialAccount.providerId = providerId;
        return socialAccount;
    }
}