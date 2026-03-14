# Kkobuk 인프라 구조

## 전체 구성도

```
[Electron 클라이언트]
        │
        ├──── HTTPS ────▶ api.kkobuk.site [EC2 #1] Nginx (블루그린)  ← Elastic IP 고정
        │                     └── Spring Boot REST API
        │                              ├── Redis (Docker: kkobuk-net)
        │                              └──── [RDS] kkobuk DB
        │
        ├──── HTTPS ────▶ ai.kkobuk.site  [EC2 LB] Nginx (least_conn LB)  ← Elastic IP 고정
        │                     └── upstream
        │                              └── [EC2 #2] Nginx (블루그린) → FastAPI
        │                                       ├── REST API (메타데이터 조회/수정)
        │                                       └── WebSocket (실시간 자세 추론)
        │                                                │
        │                                                ├──── [RDS] kkobuk_ai DB
        │                                                └──── [S3] 모델 로드 (model_id 키 LRU 캐시)
        │
        └──── WSS ───────▶ ai.kkobuk.site [EC2 LB] → [EC2 #2] (WebSocket 투명 프록시)

Spring Boot REST API
    └── AWS SDK InvokeAsync ──▶ [Lambda] 학습 파이프라인
                                    ├── [S3] 학습 데이터 읽기 → 전처리 → LR 학습
                                    ├── [S3] 모델 저장
                                    └── [RDS] kkobuk_ai DB 메타데이터 저장
```

> **수평 확장**: EC2 #2를 추가하고 EC2 LB의 `/etc/nginx/conf.d/ai-upstream.conf`에 `server <private_ip>:80;` 한 줄을 추가하면 무중단으로 AI 추론 서버를 수평 확장할 수 있습니다. 모델 캐시 키가 `model_id` 기반이라 인스턴스 간 캐시 동기화가 불필요합니다.

---

## 서비스별 상세

### EC2 #1 — REST API 서버

| 항목 | 내용 |
|------|------|
| 도메인 | `api.kkobuk.site` |
| 애플리케이션 | Spring Boot 4.0.2 + Java 25 |
| 캐시 | Redis 7 (Docker 컨테이너, `kkobuk-net` 네트워크) |
| 리버스 프록시 | Nginx |
| 배포 전략 | 블루그린 배포 |
| 보안 | HTTPS (Nginx SSL 종료), Elastic IP 고정 |

**Redis 접근 구조**
- Spring Boot 컨테이너 → Redis: Docker 네트워크(`kkobuk-net`) 내부 통신 (`redis:6379`)
- FastAPI(EC2 #2) → Redis: VPC 사설 IP (`EC2_API_PRIVATE_IP:6379`)
- 보안그룹: 6379 인바운드를 `ec2_ai` SG만 허용

### EC2 LB — AI 추론 로드밸런서

| 항목 | 내용 |
|------|------|
| 도메인 | `ai.kkobuk.site` |
| 역할 | Nginx 리버스 프록시 / 로드밸런서 |
| 알고리즘 | `least_conn` (활성 연결 수 기준, WebSocket에 적합) |
| 배포 전략 | 해당 없음 (Nginx 설정만 관리) |
| 보안 | HTTPS / WSS SSL 종료, Elastic IP 고정 |

- EC2 #2의 80 포트 인바운드는 `ec2_lb` SG에서만 허용 (인터넷 직접 노출 없음)
- AI 서버 추가 시 `/etc/nginx/conf.d/ai-upstream.conf`에 `server <private_ip>:80;` 추가 후 `nginx -s reload`

### EC2 #2 — AI 추론 서버

| 항목 | 내용 |
|------|------|
| 애플리케이션 | FastAPI (Python) |
| 리버스 프록시 | Nginx (HTTP, 포트 80) |
| 배포 전략 | 블루그린 배포 |
| 보안 | LB SG에서만 80 인바운드 허용, SSH(22)는 GitHub Actions 배포용 허용 |

**모델 캐시 전략**
- 캐시 키: `model_id` (사용자가 활성화한 모델의 DB PK)
- WebSocket 연결 시 DB에서 현재 ACTIVE `model_id` 조회 → 캐시 히트 시 즉시 반환, 미스 시 S3 로드
- 모델 교체(`activate_model`) 시 DB의 ACTIVE model_id가 변경되므로 다음 연결부터 자동으로 새 모델 사용
- 인스턴스 간 캐시 동기화 불필요

**프로토콜 분리**

| 용도 | 프로토콜 |
|------|------|
| 실시간 자세 추론 | WSS (WebSocket) |
| 모델 메타데이터 조회/수정 | HTTPS REST API |
| 학습 데이터 메타데이터 조회 | HTTPS REST API |

### RDS — MySQL

| 데이터베이스 | 사용처 |
|------|------|
| `kkobuk` | Spring Boot REST API |
| `kkobuk_ai` | FastAPI (메타데이터 읽기), Lambda (메타데이터 쓰기) |

- 단일 RDS 인스턴스에 DB 2개로 분리 (비용 절감)

### S3

| 저장 대상 | 내용 |
|------|------|
| 학습 데이터 | 사용자별 원시 학습 데이터 (~600개) |
| 모델 파일 | Lambda가 학습 후 저장한 LR 모델 |

### Lambda — 학습 파이프라인

- **트리거**: Spring Boot REST API가 AWS SDK (`InvokeAsync`)로 호출
- **인증 불필요**: VPC 내부 서버 간 호출이므로 JWT 검증 없음

1. S3에서 학습 데이터 읽기 (~600개)
2. 전처리 (`ai/shared/preprocessing_*.py`)
3. Logistic Regression 학습
4. 모델 S3 저장, 학습 데이터 S3 저장
5. `kkobuk_ai` DB에 `trained_model_metadata` 레코드 생성

---

## 인프라 관리 — Terraform

AWS 리소스(EC2, RDS, S3, Lambda, 보안 그룹 등)는 Terraform으로 코드로 관리

```
infra/
  terraform/
    main.tf                   # 전체 리소스 정의 (VPC, EC2, RDS, S3, ECR, Lambda, EIP)
    variables.tf              # 변수 선언
    outputs.tf                # EC2 EIP, RDS 엔드포인트, ECR URL 출력
    terraform.tfvars          # 실제 값 (.gitignore)
    terraform.tfvars.example  # 커밋용 예시
    user_data/
      api_server.sh           # EC2 #1 초기화 (Docker, Redis, Nginx)
      ai_server.sh            # EC2 #2 초기화 (Docker, Nginx)
      lb_server.sh            # EC2 LB 초기화 (Nginx upstream 설정)
```

**ECR 수명주기 정책**: 리포지토리(api/ai/lambda)별 최근 5개 이미지만 유지, 오래된 이미지 자동 삭제

**사용법:**
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars에 실제 값 입력 후
terraform init
terraform plan
terraform apply
```

---

## CI/CD — GitHub Actions

### EC2 #1 (Spring Boot)

```
main 브랜치 push
  └── GitHub Actions
        ├── ./gradlew build (테스트 + 빌드)
        ├── Docker 이미지 빌드 & ECR 푸시
        └── EC2 #1 SSH 접속
              └── 비활성 환경(블루/그린)에 새 이미지 배포
                    └── Nginx upstream 교체 (무중단)
```

### EC2 #2 (FastAPI)

```
main 브랜치 push
  └── GitHub Actions
        ├── Docker 이미지 빌드 & ECR 푸시
        └── EC2 #2 SSH 접속 (EC2_AI_HOST — AI 서버 EIP)
              └── 비활성 환경(블루/그린)에 새 이미지 배포
                    └── Nginx upstream 교체 (무중단)
```

> EC2 #2를 추가할 경우 GitHub Actions에서 각 인스턴스에 순차 배포 후 EC2 LB upstream에 등록

### Lambda

```
main 브랜치 push (ai/lambda/**, ai/shared/**)
  └── GitHub Actions
        ├── Docker 이미지 빌드 & ECR 푸시
        ├── aws lambda update-function-code (새 이미지 반영)
        └── aws lambda update-function-configuration (환경변수 갱신)
```

---

## 배포 전략 — 블루그린 (EC2 #1, #2 공통)

- Nginx가 트래픽을 블루/그린 중 활성 포트로 라우팅
- 신규 버전을 비활성 환경에 배포 후 Nginx 설정 교체로 무중단 전환
- 롤백 시 Nginx 설정만 이전 포트로 되돌림

```
Nginx (80/443)
  └── upstream active
        ├── blue  (예: :8080 / :8000)
        └── green (예: :8081 / :8001)
```
