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

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    public static Member create(String email, String nickname) {
        Member member = new Member();
        member.email = email;
        member.nickname = nickname;
        member.role = Role.USER;
        return member;
    }
}