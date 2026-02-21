package site.kkobuk.server.domain.posture.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import site.kkobuk.server.domain.member.entity.Member;
import site.kkobuk.server.global.common.entity.BaseCreatedTimeEntity;

import java.time.LocalDate;

@Entity
@Table(name = "posture_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostureSession extends BaseCreatedTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "session_date", nullable = false, updatable = false)
    private LocalDate sessionDate;

    @Column(name = "total_duration_sec", nullable = false, updatable = false)
    private Integer totalDurationSec;

    @Column(name = "good_posture_sec", nullable = false, updatable = false)
    private Integer goodPostureSec;

    @Column(name = "bad_posture_sec", nullable = false, updatable = false)
    private Integer badPostureSec;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false, updatable = false)
    private Member member;
}
