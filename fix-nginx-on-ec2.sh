#!/bin/bash

echo "🔧 Fixing nginx config for mydiamond99clientsupport.in..."

# Backup existing config
if [ -f /etc/nginx/sites-available/mydiamond99clientsupport.in ]; then
    sudo cp /etc/nginx/sites-available/mydiamond99clientsupport.in /etc/nginx/sites-available/mydiamond99clientsupport.in.backup
fi

# Create correct config
sudo tee /etc/nginx/sites-available/mydiamond99clientsupport.in > /dev/null << 'EOF'
server {
    listen 80;
    server_name mydiamond99clientsupport.in;

    # API Proxy - MUST COME BEFORE location /
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

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Create symlink if it doesn't exist
if [ ! -f /etc/nginx/sites-enabled/mydiamond99clientsupport.in ]; then
    sudo ln -s /etc/nginx/sites-available/mydiamond99clientsupport.in /etc/nginx/sites-enabled/
fi

# Test and reload
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ Nginx config updated and reloaded!"
echo ""
echo "Testing API endpoint..."
curl -s https://mydiamond99clientsupport.in/api/health

echo ""
echo ""
echo "If you see JSON above, it's working!"
echo "If you see HTML, check PM2 status: pm2 status"

