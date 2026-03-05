#!/bin/bash
set -e

IMAGE_URI=$1
ECR_REGISTRY=$2
AWS_REGION=$3

ACTIVE_ENV_FILE="/etc/kkobuk/active-env"
ENV_FILE="/etc/kkobuk/ai.env"
NGINX_UPSTREAM="/etc/nginx/conf.d/ai-upstream.conf"

# 현재 활성 환경 확인
CURRENT=$(cat $ACTIVE_ENV_FILE)
if [ "$CURRENT" = "blue" ]; then
  NEXT="green"
  NEXT_PORT=8001
  CURRENT_PORT=8000
else
  NEXT="blue"
  NEXT_PORT=8000
  CURRENT_PORT=8001
fi

echo "[1/5] 현재: $CURRENT ($CURRENT_PORT) → 배포 대상: $NEXT ($NEXT_PORT)"

# ECR 로그인
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR_REGISTRY

# 새 이미지 pull
echo "[2/5] 이미지 pull: $IMAGE_URI"
docker pull $IMAGE_URI

# 비활성 컨테이너 중지 및 제거
echo "[3/5] 비활성 컨테이너($NEXT) 교체"
docker stop kkobuk-ai-$NEXT 2>/dev/null || true
docker rm kkobuk-ai-$NEXT 2>/dev/null || true

# 새 컨테이너 실행
docker run -d \
  --name kkobuk-ai-$NEXT \
  --env-file $ENV_FILE \
  --restart unless-stopped \
  -p 127.0.0.1:$NEXT_PORT:8000 \
  $IMAGE_URI

# 헬스체크 (최대 60초)
echo "[4/5] 헬스체크 (port $NEXT_PORT)"
for i in $(seq 1 12); do
  if curl -sf http://127.0.0.1:$NEXT_PORT/health > /dev/null 2>&1; then
    echo "헬스체크 성공"
    break
  fi
  if [ $i -eq 12 ]; then
    echo "헬스체크 실패 — 롤백"
    docker stop kkobuk-ai-$NEXT && docker rm kkobuk-ai-$NEXT
    exit 1
  fi
  sleep 5
done

# Nginx upstream 교체
echo "[5/5] Nginx upstream → $NEXT ($NEXT_PORT)"
sudo tee $NGINX_UPSTREAM > /dev/null << EOF
upstream ai_upstream {
    server 127.0.0.1:$NEXT_PORT;
}
EOF
sudo nginx -t && sudo nginx -s reload

# 활성 환경 업데이트
echo $NEXT > $ACTIVE_ENV_FILE

# 이전 컨테이너 중지
docker stop kkobuk-ai-$CURRENT 2>/dev/null || true
docker rm kkobuk-ai-$CURRENT 2>/dev/null || true

echo "배포 완료: $NEXT ($NEXT_PORT) 활성화"
