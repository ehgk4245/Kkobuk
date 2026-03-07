package site.kkobuk.server.domain.training.dto;

import java.util.List;

public record TrainingUploadRequest(List<Sample> samples) {

    public record Sample(
            int label,
            Point nose,
            Point chin,
            Point leftEar,
            Point rightEar,
            Point leftShoulder,
            Point rightShoulder
    ) {}

    public record Point(double x, double y, double z) {}
}
