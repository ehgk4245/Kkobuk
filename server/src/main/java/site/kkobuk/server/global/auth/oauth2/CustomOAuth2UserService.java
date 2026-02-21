package site.kkobuk.server.global.auth.oauth2;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.kkobuk.server.domain.member.entity.Member;
import site.kkobuk.server.domain.member.entity.SocialAccount;
import site.kkobuk.server.domain.member.repository.MemberRepository;
import site.kkobuk.server.domain.member.repository.SocialAccountRepository;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberRepository memberRepository;
    private final SocialAccountRepository socialAccountRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        String providerId = extractProviderId(provider, oAuth2User);
        String email = extractEmail(provider, oAuth2User);
        String nickname = extractNickname(provider, oAuth2User);

        Optional<SocialAccount> existingSocial = socialAccountRepository.findByProviderAndProviderId(provider, providerId);

        Member member;
        if (existingSocial.isPresent()) {
            member = existingSocial.get().getMember();
        } else {
            Optional<Member> existingMember = email != null ? memberRepository.findByEmail(email) : Optional.empty();

            if (existingMember.isPresent()) {
                member = existingMember.get();
            } else {
                member = memberRepository.save(Member.create(email, nickname));
            }
            socialAccountRepository.save(SocialAccount.create(member, provider, providerId));
        }

        return new CustomOAuth2User(member, oAuth2User.getAttributes());
    }

    private String extractProviderId(String provider, OAuth2User oAuth2User) {
        return switch (provider) {
            case "kakao" -> String.valueOf((long) oAuth2User.getAttribute("id"));
            default -> oAuth2User.getAttribute("sub");
        };
    }

    @SuppressWarnings("unchecked")
    private String extractEmail(String provider, OAuth2User oAuth2User) {
        return switch (provider) {
            case "kakao" -> {
                Map<String, Object> kakaoAccount = oAuth2User.getAttribute("kakao_account");
                yield kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
            }
            default -> oAuth2User.getAttribute("email");
        };
    }

    @SuppressWarnings("unchecked")
    private String extractNickname(String provider, OAuth2User oAuth2User) {
        return switch (provider) {
            case "kakao" -> {
                Map<String, Object> properties = oAuth2User.getAttribute("properties");
                yield properties != null ? (String) properties.get("nickname") : "사용자";
            }
            default -> oAuth2User.getAttribute("name");
        };
    }
}