package site.kkobuk.server.global.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import site.kkobuk.server.global.auth.jwt.JwtProvider;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final StringRedisTemplate redisTemplate;
    private static final String PREFIX = "refresh:";

    public void save(Long memberId, String refreshToken) {
        redisTemplate.opsForValue().set(
                PREFIX + memberId,
                refreshToken,
                JwtProvider.getRefreshTokenExpiration(),
                TimeUnit.MILLISECONDS
        );
    }

    public String get(Long memberId) {
        return redisTemplate.opsForValue().get(PREFIX + memberId);
    }

    public void delete(Long memberId) {
        redisTemplate.delete(PREFIX + memberId);
    }
}