package site.kkobuk.server.domain.posture.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import site.kkobuk.server.domain.posture.dto.PostureSessionSaveRequest;
import site.kkobuk.server.domain.posture.dto.PostureSessionWeeklyResponse;
import site.kkobuk.server.domain.posture.service.PostureSessionService;

import java.util.List;

@RestController
@RequestMapping("/api/posture/sessions")
@RequiredArgsConstructor
public class PostureSessionController {

    private final PostureSessionService postureSessionService;

    @PostMapping
    public ResponseEntity<Void> save(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PostureSessionSaveRequest request
    ) {
        Long memberId = Long.valueOf(jwt.getSubject());
        postureSessionService.save(memberId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<PostureSessionWeeklyResponse>> getWeekly(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long memberId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(postureSessionService.getWeekly(memberId));
    }
}
