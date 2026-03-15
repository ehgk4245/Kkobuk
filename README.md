# <img src="client/resources/icon.png" width="48" align="center"> Kkobuk

거북목을 실시간으로 감지하고 교정을 도와주는 데스크탑 애플리케이션입니다.
웹캠으로 사용자의 자세를 분석해 거북목이 감지되면 즉시 알림을 보냅니다.

## 다운로드

| 플랫폼 | 다운로드 |
|--------|---------|
| Windows | [kkobuk-1.0.4-setup.exe](https://github.com/ehgk4245/Kkobuk/releases/download/v1.0.4/kkobuk-1.0.4-setup.exe) |
| macOS | [kkobuk-1.0.4.dmg](https://github.com/ehgk4245/Kkobuk/releases/download/v1.0.4/kkobuk-1.0.4.dmg) |

> 전체 릴리즈 목록: [Releases](https://github.com/ehgk4245/Kkobuk/releases)

### macOS 첫 실행 시
macOS 보안 정책으로 인해 "개발자를 확인할 수 없습니다" 경고가 표시될 수 있습니다.
앱 아이콘을 우클릭 → **열기**를 선택하면 실행됩니다.

---

## 아키텍처

![아키텍처](docs/architecture.png)

- **Spring Boot** — 사용자 인증(OAuth2/JWT), 자세 세션 기록, 주간 통계 등 핵심 비즈니스 로직 담당
- **FastAPI** — 사용자별 개인화 모델을 S3에서 로드·캐싱하고, 클라이언트와 WebSocket으로 연결해 실시간 AI 추론 처리
- **EC2 LB** — FastAPI 서버 앞단에 Nginx 로드밸런서 전용 EC2를 별도 배치, EC2 추가만으로 AI 추론 서버를 수평 확장 가능한 구조
- **Lambda** — CPU 집약적인 LR 모델 학습을 요청 시에만 실행되는 서버리스 함수로 분리해 API 서버 부하 없이 처리

---

## 프로젝트 구조

```
.github/
├── workflows/       # GitHub Actions CI/CD 워크플로우
└── scripts/         # 배포 스크립트
client/              # Electron + React 데스크탑 앱
server/              # Spring Boot REST API (api.kkobuk.site)
ai/
├── fastapi/         # FastAPI AI 추론 서버 (ai.kkobuk.site)
├── lambda/          # AWS Lambda 학습 파이프라인
└── shared/          # 전처리 공통 모듈
infra/
├── terraform/       # AWS 인프라 IaC
└── local/           # 로컬 개발용 Docker Compose (MySQL + Redis)
```

---

## 주요 기능

<details open>
<summary><b>학습</b> — 나만의 자세 모델 생성</summary>

웹캠으로 자세 데이터를 수집해 개인화된 거북목 감지 모델을 학습합니다.

| 안내 | 학습 전 | 완료 |
|------|---------|------|
| ![학습 안내](docs/screenshots/학습페이지_안내.png) | ![학습 전](docs/screenshots/학습페이지_학습전.png) | ![학습 완료](docs/screenshots/학습페이지_완료.png) |

- **나중에 학습하기** 버튼으로 학습 페이지를 건너뛰고 메인 화면으로 바로 이동 가능
- 각 자세별 **학습하기** 버튼을 누르면 30초간 자세를 측정
- 모든 자세 측정 완료 후 모델 이름과 설명을 직접 입력 가능
- **서버에 학습 요청** 버튼 클릭 시 모델 학습 시작, 완료되면 메인 페이지로 이동

</details>

<details open>
<summary><b>메인</b> — 실시간 자세 분석 및 알림</summary>

실시간으로 사용자의 자세를 분석하여 학습된 모델로 거북목을 감지합니다.

| 서비스 구동 전 | 베이스라인 측정 중 | 구동 중 |
|--------------|-----------------|--------|
| ![구동 전](docs/screenshots/메인페이지_서비스구동전.png) | ![베이스라인 측정](docs/screenshots/메인페이지_베이스라인측정.png) | ![구동 중](docs/screenshots/메인페이지_구동중.png) |

- **판별 시작하기** 버튼을 누르면 베이스라인 측정 단계로 진입
- 카메라 각도 변화에 따른 오차를 줄이기 위해 베이스라인을 측정하여 기준값으로 활용
- **새로고침** 버튼으로 베이스라인을 언제든지 재측정 가능
- 서비스 구동 중 사용 시간 동안 각 자세별 시간을 실시간으로 표시
- 거북목으로 판별되면 알림음과 함께 화면 UI가 변경

| 위젯 모드 |
|---------|
| <img src="docs/screenshots/위젯모드.png" width="300"> |

- 서비스 구동 중 소형 창으로 상태를 확인할 수 있는 **위젯 모드** 지원

</details>

<details open>
<summary><b>주간 통계</b> — 자세 대시보드</summary>

최근 7일간의 날짜별 사용 시간과 자세별 비율 및 시간을 시각화해 확인할 수 있습니다.

| 주간 통계 | 일일 상세 |
|----------|---------|
| ![주간 통계](docs/screenshots/주간통계페이지.png) | ![일일 상세](docs/screenshots/주간통계페이지_일일상세.png) |

- 최근 7일간의 날짜별 사용 시간과 자세별 비율·시간을 막대 그래프로 표시
- 막대 그래프 클릭 시 원그래프 형태의 일일 상세 통계 확인 가능

</details>

<details open>
<summary><b>설정</b> — 모델 관리 및 알림 설정</summary>

학습한 모델을 관리하고 알림 동작을 세부적으로 설정할 수 있습니다.

| 모델 설정 | 알림 설정 |
|---------|---------|
| ![모델 설정](docs/screenshots/설정페이지_모델.png) | ![알림 설정](docs/screenshots/설정페이지_알림.png) |

- 학습된 모델 목록 확인 및 **적용** 버튼으로 원하는 모델 전환 가능
- **모델 학습** 버튼으로 새 모델 추가 학습 가능 (최대 5개)
- 알림음 끄기, 음량 조절, 알림 주기 설정, 거북목 판별 기준 조정 지원

</details>

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
