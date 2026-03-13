package site.kkobuk.server.domain.posture.dto;

import java.time.LocalDate;

public record PostureSessionDailyResponse(
        String sessionDate,
        int totalDurationSec,
        int goodPostureSec,
        int badPostureSec
) {
    public static PostureSessionDailyResponse from(LocalDate date, int[] totals) {
        return new PostureSessionDailyResponse(date.toString(), totals[0], totals[1], totals[2]);
    }
}
