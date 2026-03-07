package site.kkobuk.server.domain.training.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record TrainingUploadRequest(List<Sample> samples, @NotBlank(message = "모델 이름은 필수입니다.") String name, String description) {

    public record Sample(
            int label,
            Point nose,
            Point leftEar,
            Point rightEar,
            Point leftShoulder,
            Point rightShoulder
    ) {}

    public record Point(double x, double y, double z) {}
}
