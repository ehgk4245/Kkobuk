package site.kkobuk.server.domain.posture.dto;

public record PostureSessionWeeklyResponse(
        String sessionDate,
        int totalDurationSec,
        int goodPostureSec,
        int badPostureSec
) {}
