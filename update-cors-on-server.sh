#!/bin/bash

# ========================================
# CORS Update Script for EC2 Server
# Run this on your EC2 server directly
# ========================================

echo "🔧 Updating CORS Configuration on Server..."

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
if [ ! -f "server.js" ]; then
    print_error "Please run this script from your customer-support directory"
    print_error "Expected: /home/ubuntu/customer-support/"
    exit 1
fi

print_status "Updating CORS configuration..."

# Backup current ecosystem config
cp ecosystem.config.js ecosystem.config.js.backup
print_status "Backed up current ecosystem.config.js"

# Update ecosystem.config.js with correct CORS whitelist
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'customer-support-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      MONGO_URI: 'mongodb+srv://techglobe0301:techglobe0301@cluster0.4k3mx4p.mongodb.net/customer_support?retryWrites=true&w=majority&appName=Cluster0',
      JWT_ACCESS_SECRET: 'your-super-secret-jwt-key-change-this-in-production-min-32-chars',
      JWT_ACCESS_EXPIRES_IN: '15m',
      CORS_WHITELIST: 'http://localhost:3001,http://localhost:3000,http://admin-customer-support-frontend-2025.s3-website-us-east-1.amazonaws.com,https://admin-customer-support-frontend-2025.s3-website-us-east-1.amazonaws.com,http://client-support01.s3-website-us-east-1.amazonaws.com,https://client-support01.s3-website-us-east-1.amazonaws.com,http://44.221.30.127,https://44.221.30.127,http://mydiamond99adminsupport.in,https://mydiamond99adminsupport.in,http://www.mydiamond99adminsupport.in,https://www.mydiamond99adminsupport.in,http://mydiamond99clientsupport.in,https://mydiamond99clientsupport.in,http://www.mydiamond99clientsupport.in,https://www.mydiamond99clientsupport.in',
      EMAIL_HOST: 'smtp.sendgrid.net',
      EMAIL_PORT: '587',
      EMAIL_SECURE: 'false',
      EMAIL_USER: 'apikey',
      EMAIL_PASSWORD: 'SG.your-sendgrid-api-key-here',
      EMAIL_FROM: 'your-verified-email@gmail.com',
      FRONTEND_URL: 'https://mydiamond99adminsupport.in'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

print_status "Updated ecosystem.config.js with correct CORS whitelist"

# Also update ecosystem.config.cjs
cp ecosystem.config.cjs ecosystem.config.cjs.backup
cp ecosystem.config.js ecosystem.config.cjs
print_status "Updated ecosystem.config.cjs"

# Update production.env if it exists
if [ -f "production.env" ]; then
    cp production.env production.env.backup
    sed -i 's/CORS_WHITELIST=.*/CORS_WHITELIST=http:\/\/localhost:3001,http:\/\/localhost:3000,http:\/\/admin-customer-support-frontend-2025.s3-website-us-east-1.amazonaws.com,https:\/\/admin-customer-support-frontend-2025.s3-website-us-east-1.amazonaws.com,http:\/\/client-support01.s3-website-us-east-1.amazonaws.com,https:\/\/client-support01.s3-website-us-east-1.amazonaws.com,http:\/\/44.221.30.127,https:\/\/44.221.30.127,http:\/\/mydiamond99adminsupport.in,https:\/\/mydiamond99adminsupport.in,http:\/\/www.mydiamond99adminsupport.in,https:\/\/www.mydiamond99adminsupport.in,http:\/\/mydiamond99clientsupport.in,https:\/\/mydiamond99clientsupport.in,http:\/\/www.mydiamond99clientsupport.in,https:\/\/www.mydiamond99clientsupport.in/' production.env
    print_status "Updated production.env"
fi

# Restart the application
print_status "Restarting PM2 application..."
pm2 restart customer-support-api

# Wait a moment for restart
sleep 3

# Check status
print_status "Checking application status..."
pm2 status

print_status "✅ CORS configuration updated and application restarted!"
print_warning "Testing CORS..."

# Test CORS for both domains
echo ""
echo "Testing CORS for admin domain:"
curl -H "Origin: http://mydiamond99adminsupport.in" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:4000/auth/login -v 2>&1 | grep -i "access-control"

echo ""
echo "Testing CORS for client domain:"
curl -H "Origin: http://mydiamond99clientsupport.in" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:4000/search -v 2>&1 | grep -i "access-control"

echo ""
print_status "🎉 CORS fix deployment complete!"
print_warning "Your websites should now work without CORS errors!"
