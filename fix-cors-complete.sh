#!/bin/bash

# ========================================
# Complete CORS Fix Script for EC2 Server
# Copy and paste this entire script into your EC2 server terminal
# ========================================

echo "🔧 Complete CORS Fix Script Starting..."

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
if [ ! -f "package.json" ]; then
    print_error "Please run this script from your customer-support directory"
    print_error "Expected: /home/ubuntu/customer-support/"
    exit 1
fi

print_status "Step 1: Stopping any existing PM2 processes..."
pm2 stop customer-support-api 2>/dev/null || true
pm2 delete customer-support-api 2>/dev/null || true

print_status "Step 2: Removing corrupted files..."
rm -f ecosystem.config.js

print_status "Step 3: Creating correct ecosystem.config.cjs with updated CORS..."

cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'customer-support-api',
    script: 'deployment/server.js',
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
      FRONTEND_URL: 'http://admin-customer-support-frontend-2025.s3-website-us-east-1.amazonaws.com'
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

print_status "Step 4: Creating logs directory..."
mkdir -p logs

print_status "Step 5: Starting application with PM2..."
pm2 start ecosystem.config.cjs

print_status "Step 6: Saving PM2 configuration..."
pm2 save

print_status "Step 7: Checking application status..."
pm2 status

print_status "Step 8: Waiting for application to start..."
sleep 5

print_status "Step 9: Testing CORS for admin domain..."
echo ""
echo "Testing CORS for admin domain (mydiamond99adminsupport.in):"
curl -H "Origin: http://mydiamond99adminsupport.in" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:4000/auth/login -v 2>&1 | grep -i "access-control" || echo "No CORS headers found"

echo ""
print_status "Step 10: Testing CORS for client domain..."
echo "Testing CORS for client domain (mydiamond99clientsupport.in):"
curl -H "Origin: http://mydiamond99clientsupport.in" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:4000/search -v 2>&1 | grep -i "access-control" || echo "No CORS headers found"

echo ""
print_status "Step 11: Testing server health..."
curl -s http://localhost:4000/health | head -c 100
echo ""

echo ""
print_status "✅ CORS fix deployment complete!"
print_warning "Your websites should now work without CORS errors:"
echo "  - http://mydiamond99adminsupport.in"
echo "  - http://mydiamond99clientsupport.in"
echo ""
print_status "If you still see CORS errors, please check:"
echo "  1. PM2 logs: pm2 logs customer-support-api --lines 20"
echo "  2. Application status: pm2 status"
echo "  3. Test manually: curl -H 'Origin: http://mydiamond99adminsupport.in' -X OPTIONS http://localhost:4000/auth/login -v"
