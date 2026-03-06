# Kkobuk 🐢

거북목을 실시간으로 감지하고 교정을 도와주는 데스크탑 애플리케이션입니다.
웹캠으로 사용자의 자세를 분석해 거북목이 감지되면 즉시 알림을 보냅니다.

## 다운로드

| 플랫폼 | 다운로드 |
|--------|---------|
| Windows | [kkobuk-0.1.2-setup.exe](https://github.com/ehgk4245/Kkobuk/releases/download/v0.1.2-beta/kkobuk-0.1.2-setup.exe) |
| macOS | [kkobuk-0.1.2.dmg](https://github.com/ehgk4245/Kkobuk/releases/download/v0.1.2-beta/kkobuk-0.1.2.dmg) |

> 전체 릴리즈 목록: [Releases](https://github.com/ehgk4245/Kkobuk/releases)

### macOS 첫 실행 시
macOS 보안 정책으로 인해 "개발자를 확인할 수 없습니다" 경고가 표시될 수 있습니다.
앱 아이콘을 우클릭 → **열기**를 선택하면 실행됩니다.

---

## 주요 기능

- 실시간 웹캠 자세 분석 (MediaPipe + Logistic Regression)
- 거북목 감지 시 즉시 알림
- 위젯 모드 (항상 위 소형 창)
- 주간 자세 통계 대시보드
- Google / 카카오 소셜 로그인

---

## 프로젝트 구조

```
Kkobuk/
├── client/          # Electron + React 데스크탑 앱
├── server/          # Spring Boot REST API (api.kkobuk.site)
├── ai/
│   ├── fastapi/     # FastAPI AI 추론 서버 (ai.kkobuk.site)
│   ├── lambda/      # AWS Lambda 학습 파이프라인
│   └── shared/      # 전처리 공통 모듈
└── infra/
    ├── terraform/   # AWS 인프라 IaC
    └── local/       # 로컬 개발용 Docker Compose (MySQL + Redis)
```

### 아키텍처

```
[Electron 클라이언트]
        │  MediaPipe로 포즈 랜드마크 추출
        │
        ├── HTTPS ──▶ api.kkobuk.site  (Spring Boot)
        │                  ├── OAuth2 로그인 (Google / 카카오)
        │                  ├── JWT 인증 / 자세 세션 기록
        │                  └── AWS SDK ──▶ Lambda (학습 파이프라인)
        │                                      └── LR 모델 학습 → S3 저장
        │                                                          → kkobuk_ai DB 저장
        │
        └── WSS ────▶ ai.kkobuk.site   (FastAPI)
                           └── 랜드마크 수신 → LR 모델 추론 → 자세 판별 결과 반환
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 클라이언트 | Electron 39, React 19, Vite, Tailwind CSS, MediaPipe |
| API 서버 | Spring Boot 4.0.2, Java 25, Redis 7 |
| AI 추론 서버 | FastAPI, scikit-learn (Logistic Regression) |
| 학습 파이프라인 | AWS Lambda (Python), scikit-learn, NumPy, SciPy |
| 데이터 저장소 | MySQL 8 (RDS — kkobuk / kkobuk_ai), Redis 7, AWS S3 |
| 인프라 | AWS EC2 × 2, RDS, S3, Lambda / Terraform / Nginx 블루그린 배포 |
| CI/CD | GitHub Actions |
