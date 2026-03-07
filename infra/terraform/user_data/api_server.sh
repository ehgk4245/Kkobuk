#!/bin/bash
set -e

apt update && apt upgrade -y
apt install -y docker.io nginx certbot python3-certbot-nginx awscli

# Swap 2GB 설정
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf

systemctl enable docker nginx
systemctl start docker
usermod -aG docker ubuntu

docker network create kkobuk-net

mkdir -p /data/redis
docker run -d \
  --name redis \
  --network kkobuk-net \
  --restart always \
  -p 6379:6379 \
  -v /data/redis:/data \
  redis:7-alpine \
  redis-server --requirepass "${redis_password}"

# 블루그린 상태 파일
mkdir -p /etc/kkobuk
chown ubuntu:ubuntu /etc/kkobuk
echo "blue" > /etc/kkobuk/active-env

# Nginx 초기 upstream 설정 (blue=8080)
cat > /etc/nginx/conf.d/api-upstream.conf << 'EOF'
upstream api_upstream {
    server 127.0.0.1:8080;
}
EOF

# Nginx 사이트 설정
cat > /etc/nginx/sites-available/kkobuk-api << EOF
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://api_upstream;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/kkobuk-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
