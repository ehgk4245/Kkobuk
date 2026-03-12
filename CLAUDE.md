# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kkobuk**는 자세 교정 데스크탑 애플리케이션으로, 네 개의 모듈로 구성됩니다:
- `server/` — Spring Boot 4.0.2 + Java 25 백엔드 (OAuth2 + JWT 인증) → `api.kkobuk.site`
- `client/` — Electron 39 + React 19 + Vite 데스크탑 프론트엔드
- `ai/` — AI 관련 코드 전체
  - `ai/fastapi/` — FastAPI 기반 AI 추론 서비스 (실시간 자세 추론, 모델/학습데이터 메타데이터 관리) → `ai.kkobuk.site`
  - `ai/lambda/` — 학습 파이프라인 Lambda 함수 (전처리 → 모델 학습 → S3 저장 → DB 기록)
  - `ai/shared/` — FastAPI/Lambda 공통 모듈 (JWT 검증, 전처리 로직)
- `infra/` — AWS 인프라 설계 문서 및 Terraform IaC

## Commands

### Server (Spring Boot)

```bash
cd server

# 개발 서버 실행 (MySQL/Redis 먼저 실행 필요)
./gradlew bootRun

# 빌드
./gradlew build

### Client (Electron + React)

```bash
cd client

npm install           # 의존성 설치
npm run dev           # 개발 모드 (Electron 앱 실행)
npm run build         # 번들 빌드
npm run build:win     # Windows 실행 파일 빌드
npm run lint          # ESLint 검사
npm run format        # Prettier 포맷
```

### AI Service (FastAPI)

```bash
cd ai/fastapi
pip install -r requirements.txt
cp .env.example .env   # 환경변수 설정 후
uvicorn main:app --reload --env-file .env
```

### Infrastructure (로컬 개발)

```bash
cd infra/local
docker-compose up -d    # MySQL 8.0 (kkobuk + kkobuk_ai DB) + Redis 7 컨테이너 실행
docker-compose down     # 컨테이너 종료
```

프로덕션 인프라는 Terraform으로 관리, CI/CD는 GitHub Actions 사용.
전체 구조는 [infra/INFRASTRUCTURE.md](infra/INFRASTRUCTURE.md) 참고.

## Architecture

### Server — 패키지 구조

`site.kkobuk.server` 아래 두 가지 최상위 패키지로 나뉩니다:

**`domain/`** — 비즈니스 도메인별 레이어드 아키텍처
- `member/` — 회원 관리 (entity, repository, service, controller, dto)
- `posture/` — 자세 세션 기록 (entity, repository, service, controller, dto)
- `training/` — 학습 데이터 업로드 및 Lambda 호출 (controller, service, dto)

**`global/`** — 횡단 관심사
- `auth/` — JWT (`JwtProvider`), OAuth2 (`CustomOAuth2UserService`, `OAuth2SuccessHandler`), 리프레시 토큰 서비스, 토큰 재발급 (`AuthController`)
- `config/` — `SecurityConfig`, `JpaConfig`, `AwsConfig`
- `error/` — `ErrorCode` enum, `GlobalExceptionHandler`, 커스텀 예외
- `common/` — 베이스 엔티티

### 인증 흐름

1. 사용자가 Google/Kakao OAuth2로 로그인
2. `OAuth2SuccessHandler`가 JWT 액세스 토큰(24h)과 리프레시 토큰(30d) 발급
3. 리프레시 토큰은 Redis에 저장
4. 딥링크 `kkobuk://callback`으로 Electron 클라이언트에 토큰 전달
5. 클라이언트는 토큰 저장 후 AI 서버(`GET /api/models`)로 학습 모델 유무 확인 → 모델 있으면 `/main`, 없으면 `/onboarding`으로 분기
6. API 요청 중 401 응답 시 `POST /auth/reissue`로 토큰 재발급, 실패 시 로그인 페이지로 이동

### AI Service — 구조

```
ai/
  fastapi/
    main.py          # FastAPI 인스턴스, 라우터 등록, CORS 설정
    requirements.txt
    app/
      api/
        model.py     # GET /api/models, PUT /api/models/{id}/activate
        posture.py   # WebSocket /ws/posture (실시간 자세 추론)
      core/
        auth.py      # JWT 검증 (FastAPI 전용, Spring Boot 시크릿 공유)
        database.py  # SQLAlchemy 엔진/세션, AI_DATABASE_URL 환경변수
      models/
        ai_metadata.py  # TrainingDataMetadata, TrainedModelMetadata, ModelStatus ENUM
      services/
        inference.py # 모델 로드(LRU 캐시), predict, build_baseline
  lambda/
    handler.py       # Lambda 핸들러 (학습 파이프라인)
    requirements.txt
  shared/
    preprocessing_V1.py
    preprocessing_V2.py  # compute_baseline, extract_features (Lambda/FastAPI 공용)
```

- AI 서비스 전용 RDB (RDS 내 별도 DB `kkobuk_ai`) 사용
- 학습 데이터 및 모델 파일은 S3 저장, 메타데이터만 RDB 관리
- `ModelStatus`: `ACTIVE`(선택된 모델) / `INACTIVE`
- `model_bundle` 형식: `{"model": LogisticRegression, "scaler": StandardScaler, "baseline": np.ndarray}` — Lambda가 `pickle.dumps`로 저장

### Client — 구조

```
src/
  main/        # Electron 메인 프로세스
  preload/     # IPC 브릿지
  renderer/src/
    App.jsx          # HashRouter 루트, WebcamProvider
    pages/           # Login, Onboarding, Training, Main, Settings
    components/
      common/TitleBar.jsx  # 창 컨트롤 바 (최소화/닫기)
    context/
      WebcamContext.jsx    # 웹캠 스트림/권한 전역 관리
    utils/
      api.js         # apiFetch (Spring Boot), aiFetch (FastAPI) — 401 시 자동 토큰 갱신
    assets/          # CSS (Tailwind)
```

**페이지 라우팅:**
- `/` → Login (OAuth2, 토큰 확인 후 자동 분기)
- `/onboarding` → Onboarding (웹캠 권한 요청)
- `/training` → Training (자세 데이터 수집 + 모델 학습 요청)
- `/main` → Main (실시간 자세 추론, 위젯 모드)
- `/settings` → Settings (모델 활성화, 알림 설정, 로그아웃)

### 엔티티 관계

- `Member` — 사용자 기본 정보
- `SocialAccount` — OAuth2 소셜 로그인 정보 (Member와 별도 분리)
- `PostureSession` — 자세 측정 세션 데이터

## Configuration

`server/.env` (→ `server/.env.example` 참고):
```
# OAuth2
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# JWT
JWT_SECRET_KEY=

# Database (prod only)
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=

# Redis (prod only)
SPRING_REDIS_HOST=
SPRING_REDIS_PASSWORD=

# AWS (prod only)
AWS_REGION=
S3_BUCKET_NAME=
LAMBDA_FUNCTION_NAME=
```

`client/.env` (→ `client/.env.example` 참고):
```
VITE_API_BASE_URL=
VITE_AI_BASE_URL=
VITE_AI_WS_URL=
```

`ai/fastapi/.env` (→ `ai/fastapi/.env.example` 참고):
```
AI_DATABASE_URL=
JWT_SECRET_KEY=
REDIS_HOST=      # 로컬: 127.0.0.1 / prod: EC2 #1 VPC private IP
REDIS_PASSWORD=
```

## Code Style

**Client**: `.prettierrc.yaml` — 싱글 쿼트, 세미콜론 없음, 줄 너비 100, trailing comma 없음

**Server**: Lombok 사용, Spring 레이어드 컨벤션 준수
