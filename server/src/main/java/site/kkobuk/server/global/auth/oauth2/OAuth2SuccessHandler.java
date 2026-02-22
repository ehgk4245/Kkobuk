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

        String deepLink = "kkobuk://callback?accessToken=" + accessToken + "&refreshToken=" + refreshToken;
        String html = """
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>로그인 완료 - 꼬북</title>
                    <style>
                        :root {
                            --color-primary-light: #8bc34a;
                            --color-primary-main: #4caf50;
                            --color-accent-main: #ffc107;
                            --color-gray-900: #121212;
                            --color-gray-800: #1e1e1e;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            min-height: 100vh;
                            background-color: var(--color-gray-900);
                            color: #ffffff;
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }
                        .card {
                            background-color: var(--color-gray-800);
                            padding: 3rem 2.5rem;
                            border-radius: 1.5rem;
                            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                            text-align: center;
                            max-width: 400px;
                            width: 90%%;
                            animation: fade-in-up 0.5s ease-out both;
                        }
                        .icon-container {
                            width: 80px;
                            height: 80px;
                            background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary-main));
                            border-radius: 50%%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            margin: 0 auto 1.5rem;
                            font-size: 2.5rem;
                            box-shadow: 0 4px 15px rgba(139, 195, 74, 0.3);
                        }
                        .icon {
                            animation: bounce 2s infinite ease-in-out;
                        }
                        h1 {
                            margin: 0 0 1rem 0;
                            font-size: 1.75rem;
                            font-weight: 700;
                            letter-spacing: -0.025em;
                        }
                        p {
                            margin: 0 0 2.5rem 0;
                            color: rgba(255, 255, 255, 0.7);
                            font-size: 1rem;
                            line-height: 1.6;
                        }
                        .btn {
                            display: inline-block;
                            background-color: var(--color-accent-main);
                            color: #000000;
                            text-decoration: none;
                            padding: 1rem 2rem;
                            border-radius: 9999px;
                            font-weight: 600;
                            font-size: 1.05rem;
                            transition: all 0.2s ease;
                            box-shadow: 0 4px 10px rgba(255, 193, 7, 0.2);
                        }
                        .btn:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 6px 15px rgba(255, 193, 7, 0.4);
                            background-color: #ffd54f;
                        }
                        @keyframes fade-in-up {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        @keyframes bounce {
                            0%%, 100%% { transform: translateY(0); }
                            50%% { transform: translateY(-5px); }
                        }
                    </style>
                    <script>
                        setTimeout(function() { window.location = '%s'; }, 300);
                    </script>
                </head>
                <body>
                    <div class="card">
                        <div class="icon-container">
                            <div class="icon">🐢</div>
                        </div>
                        <h1>로그인 완료!</h1>
                        <p>꼬북 앱으로 돌아가세요.<br>이 창은 닫아도 됩니다.</p>
                        <a class="btn" href="%s">앱으로 돌아가기</a>
                    </div>
                </body>
                </html>
                """.formatted(deepLink, deepLink);

        response.setContentType("text/html; charset=UTF-8");
        response.getWriter().write(html);
    }
}