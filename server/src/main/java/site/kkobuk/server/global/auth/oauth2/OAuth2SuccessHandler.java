package site.kkobuk.server.global.auth.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import site.kkobuk.server.domain.member.entity.Member;
import site.kkobuk.server.global.auth.jwt.JwtProvider;
import site.kkobuk.server.global.auth.service.RefreshTokenService;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        Member member = oAuth2User.getMember();

        String accessToken = jwtProvider.createAccessToken(member.getId(), member.getEmail(), member.getRole().getKey());
        String refreshToken = jwtProvider.createRefreshToken(member.getId());

        refreshTokenService.save(member.getId(), refreshToken);
        response.sendRedirect("kkobuk://callback?accessToken=" + accessToken + "&refreshToken=" + refreshToken);
    }
}