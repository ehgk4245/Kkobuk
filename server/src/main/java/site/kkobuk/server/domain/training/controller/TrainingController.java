package site.kkobuk.server.domain.training.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import site.kkobuk.server.domain.training.dto.TrainingUploadRequest;
import site.kkobuk.server.domain.training.service.TrainingService;

@RestController
@RequestMapping("/api/training")
@RequiredArgsConstructor
public class TrainingController {

    private final TrainingService trainingService;

    @PostMapping("/upload")
    public ResponseEntity<Void> upload(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody TrainingUploadRequest request
    ) {
        Long memberId = Long.valueOf(jwt.getSubject());
        trainingService.uploadAndTrain(memberId, request);
        return ResponseEntity.ok().build();
    }
}
