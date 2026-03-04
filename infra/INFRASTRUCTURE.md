# Kkobuk 인프라 구조

## 전체 구성도

```
[Electron 클라이언트]
        │
        ├──── HTTPS ────▶ api.kkobuk.site [EC2 #1] Nginx (블루그린)
        │                     └── Spring Boot REST API + Redis
        │                              │
        │                              └──── [RDS] kkobuk DB
        │
        ├──── HTTPS ────▶ ai.kkobuk.site  [EC2 #2] Nginx (블루그린)
        │                     └── FastAPI
        │                          ├── REST API (메타데이터 조회/수정)
        │                          └── WebSocket (실시간 자세 추론)
        │                                   │
        │                                   ├──── [RDS] kkobuk_ai DB
        │                                   └──── [S3] 모델 로드 (메모리 캐시)
        │
        └──── WSS ───────▶ ai.kkobuk.site [EC2 #2] (동일 서버, WebSocket 엔드포인트)

[Lambda] 학습 요청 수신
    └── 전처리 → LR 학습 → [S3] 모델 저장
                               └──── [S3] 학습 데이터
```

---

## 서비스별 상세

### EC2 #1 — REST API 서버

| 항목 | 내용 |
|------|------|
| 도메인 | `api.kkobuk.site` |
| 애플리케이션 | Spring Boot 4.0.2 + Java 25 |
| 캐시 | Redis (로컬, 리프레시 토큰 저장) |
| 리버스 프록시 | Nginx |
| 배포 전략 | 블루그린 배포 |
| 보안 | HTTPS (Nginx SSL 종료) |

### EC2 #2 — AI 서버

| 항목 | 내용 |
|------|------|
| 도메인 | `ai.kkobuk.site` |
| 애플리케이션 | FastAPI (Python) |
| 리버스 프록시 | Nginx |
| 배포 전략 | 블루그린 배포 |
| 보안 | HTTPS / WSS (Nginx SSL 종료) |

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
| `kkobuk_ai` | FastAPI AI 서버 (메타데이터) |

- 단일 RDS 인스턴스에 DB 2개로 분리 (비용 절감)

### S3

| 저장 대상 | 내용 |
|------|------|
| 학습 데이터 | 사용자별 원시 학습 데이터 (~600개) |
| 모델 파일 | Lambda가 학습 후 저장한 LR 모델 |

### Lambda — 학습 파이프라인

1. 학습 데이터(~600개) 수신
2. 전처리
3. Logistic Regression 학습
4. 모델 S3 저장
5. `kkobuk_ai` DB에 `trained_model_metadata` 레코드 생성

---

## 인프라 관리 — Terraform

AWS 리소스(EC2, RDS, S3, Lambda, 보안 그룹 등)는 Terraform으로 코드로 관리

```
infra/
  terraform/
    main.tf
    variables.tf              # 변수 선언
    outputs.tf
    terraform.tfvars          # 실제 값 (.gitignore)
    terraform.tfvars.example  # 커밋용 예시
    modules/
      ec2/
      rds/
      s3/
      lambda/
```

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
        └── EC2 #2 SSH 접속
              └── 비활성 환경(블루/그린)에 새 이미지 배포
                    └── Nginx upstream 교체 (무중단)
```

### Lambda

```
main 브랜치 push
  └── GitHub Actions
        └── Lambda 함수 패키징 & 배포 (aws lambda update-function-code)
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
