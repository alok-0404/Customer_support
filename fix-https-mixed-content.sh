#!/bin/bash

# ========================================
# Fix Mixed Content Error - Add HTTPS Support
# Run this on your EC2 server
# ========================================

echo "🔧 Fixing Mixed Content Error by adding HTTPS support..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "deployment/server.js" ]; then
    print_error "Please run this script from your customer-support directory"
    print_error "Expected: /home/ubuntu/customer-support/"
    exit 1
fi

print_status "Step 1: Installing Nginx for HTTPS proxy..."
sudo apt update
sudo apt install nginx -y

print_status "Step 2: Creating SSL certificate (self-signed for now)..."
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=IN/ST=State/L=City/O=Organization/CN=44.221.30.127"

print_status "Step 3: Creating Nginx configuration for HTTPS proxy..."

sudo tee /etc/nginx/sites-available/customer-support-https << 'EOF'
server {
    listen 80;
    server_name 44.221.30.127;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 44.221.30.127;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://mydiamond99adminsupport.in" always;
    add_header Access-Control-Allow-Origin "https://mydiamond99clientsupport.in" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Allow-Credentials true always;

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
    }
}
EOF

print_status "Step 4: Enabling the site..."
sudo ln -sf /etc/nginx/sites-available/customer-support-https /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

print_status "Step 5: Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    print_status "Step 6: Restarting Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    print_status "Step 7: Updating firewall..."
    sudo ufw allow 'Nginx Full'
    sudo ufw allow ssh
    
    print_status "Step 8: Testing HTTPS endpoint..."
    sleep 2
    curl -k https://44.221.30.127/health || echo "HTTPS test failed"
    
    echo ""
    print_status "✅ HTTPS setup complete!"
    print_warning "Your API is now available at:"
    echo "  - https://44.221.30.127 (HTTPS)"
    echo "  - http://44.221.30.127 (HTTP - redirects to HTTPS)"
    echo ""
    print_warning "Update your frontend to use: https://44.221.30.127"
    echo ""
    print_warning "Note: This uses a self-signed certificate."
    print_warning "For production, consider using Let's Encrypt for proper SSL."
    
else
    print_error "Nginx configuration test failed!"
    exit 1
fi
