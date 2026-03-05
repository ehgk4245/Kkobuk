#!/bin/bash
set -e

IMAGE_URI=$1
ECR_REGISTRY=$2
AWS_REGION=$3

ACTIVE_ENV_FILE="/etc/kkobuk/active-env"
ENV_FILE="/etc/kkobuk/api.env"
NGINX_UPSTREAM="/etc/nginx/conf.d/api-upstream.conf"

# 현재 활성 환경 확인
CURRENT=$(cat $ACTIVE_ENV_FILE)
if [ "$CURRENT" = "blue" ]; then
  NEXT="green"
  NEXT_PORT=8081
  CURRENT_PORT=8080
else
  NEXT="blue"
  NEXT_PORT=8080
  CURRENT_PORT=8081
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
docker stop kkobuk-api-$NEXT 2>/dev/null || true
docker rm kkobuk-api-$NEXT 2>/dev/null || true

# 새 컨테이너 실행
docker run -d \
  --name kkobuk-api-$NEXT \
  --env-file $ENV_FILE \
  --restart unless-stopped \
  --network kkobuk-net \
  -p 127.0.0.1:$NEXT_PORT:8080 \
  $IMAGE_URI

# 헬스체크 (최대 120초)
echo "[4/5] 헬스체크 (port $NEXT_PORT)"
for i in $(seq 1 24); do
  if curl -sf http://127.0.0.1:$NEXT_PORT/actuator/health > /dev/null 2>&1; then
    echo "헬스체크 성공"
    break
  fi
  if [ $i -eq 24 ]; then
    echo "헬스체크 실패 — 컨테이너 로그:"
    docker logs --tail 50 kkobuk-api-$NEXT
    echo "롤백"
    docker stop kkobuk-api-$NEXT && docker rm kkobuk-api-$NEXT
    exit 1
  fi
  sleep 5
done

# Nginx upstream 교체
echo "[5/5] Nginx upstream → $NEXT ($NEXT_PORT)"
sudo tee $NGINX_UPSTREAM > /dev/null << EOF
upstream api_upstream {
    server 127.0.0.1:$NEXT_PORT;
}
EOF
sudo nginx -t && sudo nginx -s reload

# 활성 환경 업데이트
rm -f $ACTIVE_ENV_FILE && echo $NEXT > $ACTIVE_ENV_FILE

# 이전 컨테이너 중지
docker stop kkobuk-api-$CURRENT 2>/dev/null || true
docker rm kkobuk-api-$CURRENT 2>/dev/null || true

# 미사용 이미지 정리 (실행 중인 컨테이너 이미지는 유지)
docker image prune -af

echo "배포 완료: $NEXT ($NEXT_PORT) 활성화"
