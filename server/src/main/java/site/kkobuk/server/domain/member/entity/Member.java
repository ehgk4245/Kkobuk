package site.kkobuk.server.domain.member.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import site.kkobuk.server.domain.member.entity.enums.Role;
import site.kkobuk.server.global.common.entity.BaseTimeEntity;

@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "email", unique = true, length = 100)
    private String email;

    @Column(name = "nickname", nullable = false, length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING) // ⭐️ 별 다섯 개!
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Column(name = "provider", nullable = false, updatable = false, length = 20)
    private String provider;

    @Column(name = "provider_id", nullable = false, updatable = false, length = 100)
    private String providerId;
}
