#!/bin/bash
# Run this on EC2 to fix nginx config

echo "🔧 Fixing nginx config..."

sudo tee /etc/nginx/sites-available/mydiamond99clientsupport.in > /dev/null << 'EOF'
server {
    listen 80;
    server_name mydiamond99clientsupport.in;

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        rewrite ^/api/(.*)$ /$1 break;
    }

    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
EOF

echo "✅ Config updated!"
echo ""
echo "Testing nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo ""
echo "Testing API..."
curl https://mydiamond99clientsupport.in/api/health

