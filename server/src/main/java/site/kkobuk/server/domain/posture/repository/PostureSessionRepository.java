package site.kkobuk.server.domain.posture.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import site.kkobuk.server.domain.posture.entity.PostureSession;

import java.time.LocalDate;
import java.util.List;

public interface PostureSessionRepository extends JpaRepository<PostureSession, Long> {

    List<PostureSession> findByMemberIdAndSessionDateBetweenOrderBySessionDate(
            Long memberId, LocalDate from, LocalDate to
    );
}
