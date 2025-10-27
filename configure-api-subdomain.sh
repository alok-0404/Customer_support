#!/bin/bash

# Script to configure nginx for api.mydiamond99clientsupport.in subdomain
# This should be run on the EC2 server

echo "🔧 Configuring API subdomain..."

# Create nginx config for API subdomain
sudo tee /etc/nginx/sites-available/api.mydiamond99clientsupport.in > /dev/null << 'EOF'
server {
    listen 80;
    server_name api.mydiamond99clientsupport.in;

    # Add CORS headers
    add_header 'Access-Control-Allow-Origin' '$http_origin' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/api.mydiamond99clientsupport.in /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

echo "✅ API subdomain configured!"
echo "Now you need to:"
echo "1. Add DNS A record for api.mydiamond99clientsupport.in pointing to 44.221.30.127"
echo "2. Set up SSL certificate: sudo certbot --nginx -d api.mydiamond99clientsupport.in"

