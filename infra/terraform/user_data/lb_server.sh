#!/bin/bash
set -e

apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx

systemctl enable nginx
systemctl start nginx

# Nginx upstream (AI 서버 목록)
cat > /etc/nginx/conf.d/ai-upstream.conf << EOF
upstream ai_backend {
    least_conn;
    server ${ai_server_ip}:80;
    keepalive 32;
}
EOF

# Nginx 사이트 설정
cat > /etc/nginx/sites-available/kkobuk-ai-lb << EOF
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://ai_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket 지원
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600;
    }
}
EOF

ln -sf /etc/nginx/sites-available/kkobuk-ai-lb /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
