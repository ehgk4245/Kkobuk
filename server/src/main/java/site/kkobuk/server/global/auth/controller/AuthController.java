package site.kkobuk.server.global.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import site.kkobuk.server.domain.member.entity.Member;
import site.kkobuk.server.domain.member.repository.MemberRepository;
import site.kkobuk.server.global.auth.jwt.JwtProvider;
import site.kkobuk.server.global.auth.service.RefreshTokenService;
import site.kkobuk.server.global.error.ErrorCode;
import site.kkobuk.server.global.error.exception.BusinessException;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
    private final MemberRepository memberRepository;

    @PostMapping("/reissue")
    public ResponseEntity<Map<String, String>> reissue(@RequestHeader("X-Refresh-Token") String refreshToken) {
        if (!jwtProvider.isValid(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        Long memberId = jwtProvider.getMemberId(refreshToken);
        String savedToken = refreshTokenService.get(memberId);

        if (savedToken == null || !savedToken.equals(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        String newAccessToken = jwtProvider.createAccessToken(member.getId(), member.getEmail(), member.getRole().getKey());
        String newRefreshToken = jwtProvider.createRefreshToken(member.getId());

        refreshTokenService.save(member.getId(), newRefreshToken);

        return ResponseEntity.ok(Map.of("accessToken", newAccessToken, "refreshToken", newRefreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Jwt jwt) {
        Long memberId = Long.valueOf(jwt.getSubject());
        refreshTokenService.delete(memberId);
        return ResponseEntity.ok().build();
    }
}