package site.kkobuk.server.domain.posture.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PostureSessionSaveRequest(
        @NotNull @Min(1) Integer totalDurationSec,
        @NotNull @Min(0) Integer goodPostureSec,
        @NotNull @Min(0) Integer badPostureSec
) {}
