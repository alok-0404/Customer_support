#!/bin/bash

# SSL Setup Script for Customer Support Backend
# Run this on your EC2 instance

set -e

echo "🚀 Starting SSL Setup..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install Nginx
echo "📦 Installing Nginx..."
sudo yum install nginx -y

# Install Certbot
echo "📦 Installing Certbot..."
sudo yum install certbot python3-certbot-nginx -y

# Start and enable Nginx
echo "🔄 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Get SSL certificate
echo "🔒 Getting SSL certificate..."
read -p "Enter your domain name (e.g., mydiamond99clientsupport.in): " DOMAIN

sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Create Nginx config directory if it doesn't exist
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Copy nginx config
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/conf.d/customer-support.conf > /dev/null << 'NGINXCONF'
server {
    listen 80;
    server_name 44.221.30.127 mydiamond99clientsupport.in www.mydiamond99clientsupport.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 44.221.30.127 mydiamond99clientsupport.in www.mydiamond99clientsupport.in;
    
    ssl_certificate /etc/letsencrypt/live/mydiamond99clientsupport.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mydiamond99clientsupport.in/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    location /health {
        proxy_pass http://localhost:4000/health;
        access_log off;
    }
}
NGINXCONF

# Test Nginx config
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ SSL Setup Complete!"
echo "🌐 Your API is now available at: https://mydiamond99clientsupport.in"
echo ""
echo "📝 Next Steps:"
echo "1. Update frontend API URL to: https://mydiamond99clientsupport.in"
echo "2. Rebuild and redeploy frontend"
echo "3. Test on mobile device"
