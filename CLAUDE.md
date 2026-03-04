# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kkobuk**는 자세 교정 데스크탑 애플리케이션으로, 네 개의 모듈로 구성됩니다:
- `server/` — Spring Boot 4.0.2 + Java 25 백엔드 (OAuth2 + JWT 인증) → `api.kkobuk.site`
- `client/` — Electron 39 + React 19 + Vite 데스크탑 프론트엔드
- `ai/` — FastAPI 기반 AI 추론 서비스 (실시간 자세 추론, 모델/학습데이터 메타데이터 관리) → `ai.kkobuk.site`
- `infra/` — AWS 인프라 설계 문서 및 Terraform IaC

## Commands

### Server (Spring Boot)

```bash
cd server

# 개발 서버 실행 (MySQL/Redis 먼저 실행 필요)
./gradlew bootRun

# 빌드
./gradlew build

# 테스트 전체 실행
./gradlew test

# 단일 테스트 클래스 실행
./gradlew test --tests "site.kkobuk.server.ServerApplicationTests"
```

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
uvicorn main:app --reload
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

**`global/`** — 횡단 관심사
- `auth/` — JWT (`JwtProvider`), OAuth2 (`CustomOAuth2UserService`, `OAuth2SuccessHandler`), 리프레시 토큰 서비스
- `config/` — `SecurityConfig`, `JpaConfig`
- `error/` — `ErrorCode` enum, `GlobalExceptionHandler`, 커스텀 예외
- `common/` — 베이스 엔티티

### 인증 흐름

1. 사용자가 Google/Kakao OAuth2로 로그인
2. `OAuth2SuccessHandler`가 JWT 액세스 토큰(24h)과 리프레시 토큰(30d) 발급
3. 리프레시 토큰은 Redis에 저장
4. 딥링크 `kkobuk://callback`으로 Electron 클라이언트에 토큰 전달

### AI Service — 구조

```
ai/fastapi/
  main.py          # FastAPI 인스턴스, 라우터 등록
  requirements.txt
  app/
    api/           # 엔드포인트 (APIRouter)
    core/
      database.py  # SQLAlchemy 엔진/세션, AI_DATABASE_URL 환경변수
    models/
      ai_metadata.py  # TrainingDataMetadata, TrainedModelMetadata, ModelStatus ENUM
    services/      # 비즈니스 로직 (추론 등)
```

- AI 서비스 전용 RDB (RDS 내 별도 DB `kkobuk_ai`) 사용
- 학습 데이터 및 모델 파일은 S3 저장, 메타데이터만 RDB 관리
- `ModelStatus`: `ACTIVE`(선택된 모델) / `INACTIVE`

### Client — 구조

```
src/
  main/        # Electron 메인 프로세스
  preload/     # IPC 브릿지
  renderer/src/
    App.jsx          # HashRouter 루트
    pages/           # Login, Onboarding, Training, Main, Dashboard, Settings
    components/      # 공통 컴포넌트 (예: TitleBar)
    assets/          # CSS (Tailwind)
```

### 엔티티 관계

- `Member` — 사용자 기본 정보
- `SocialAccount` — OAuth2 소셜 로그인 정보 (Member와 별도 분리)
- `PostureSession` — 자세 측정 세션 데이터

## Configuration

`server/.env` 파일에 아래 환경변수 필요:
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
JWT_SECRET_KEY=
```

`ai/fastapi`의 환경변수:
```
AI_DATABASE_URL=mysql+pymysql://user:password@host:3306/kkobuk_ai
```

`server/src/main/resources/application.yml` — DB(MySQL localhost:3306/kkobuk), Redis(localhost:6379), JPA DDL auto-update 설정 포함

## Code Style

**Client**: `.prettierrc.yaml` — 싱글 쿼트, 세미콜론 없음, 줄 너비 100, trailing comma 없음

**Server**: Lombok 사용, Spring 레이어드 컨벤션 준수
