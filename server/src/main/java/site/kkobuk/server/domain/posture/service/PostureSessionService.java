package site.kkobuk.server.domain.posture.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.kkobuk.server.domain.member.entity.Member;
import site.kkobuk.server.domain.member.repository.MemberRepository;
import site.kkobuk.server.domain.posture.dto.PostureSessionSaveRequest;
import site.kkobuk.server.domain.posture.dto.PostureSessionDailyResponse;
import site.kkobuk.server.domain.posture.entity.PostureSession;
import site.kkobuk.server.domain.posture.repository.PostureSessionRepository;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PostureSessionService {

    private final PostureSessionRepository postureSessionRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public void save(Long memberId, PostureSessionSaveRequest request) {
        Member member = memberRepository.getReferenceById(memberId);
        PostureSession session = PostureSession.create(
                member,
                request.totalDurationSec(),
                request.goodPostureSec(),
                request.badPostureSec()
        );
        postureSessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public List<PostureSessionDailyResponse> getWeekly(Long memberId) {
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(6);

        List<PostureSession> sessions = postureSessionRepository
                .findByMemberIdAndSessionDateBetweenOrderBySessionDate(memberId, from, today);

        // 날짜별 합산
        Map<LocalDate, int[]> byDate = new LinkedHashMap<>();
        for (PostureSession s : sessions) {
            byDate.computeIfAbsent(s.getSessionDate(), k -> new int[3]);
            int[] totals = byDate.get(s.getSessionDate());
            totals[0] += s.getTotalDurationSec();
            totals[1] += s.getGoodPostureSec();
            totals[2] += s.getBadPostureSec();
        }

        return byDate.entrySet().stream()
                .map(e -> PostureSessionDailyResponse.from(e.getKey(), e.getValue()))
                .toList();
    }
}
