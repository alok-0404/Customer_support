#!/bin/bash

# Twilio Credentials Setup Script for EC2 Server
# This script will configure Twilio environment variables on the server

echo "🔧 Twilio Credentials Setup Script"
echo ""

# SSH Configuration
KEY_FILE="${EC2_KEY_FILE:-customer-support-backend.pem}"
EC2_IP="${EC2_IP:-44.221.30.127}"
EC2_USER="${EC2_USER:-ubuntu}"
REMOTE_DIR="/home/ubuntu/apps/customer-support"

# Check if key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo "⚠️  Key file not found: $KEY_FILE"
    echo "Please set EC2_KEY_FILE environment variable or place key file in current directory"
    exit 1
fi

echo "📡 Connecting to server: $EC2_USER@$EC2_IP"
echo "📂 Remote directory: $REMOTE_DIR"
echo ""

# Prompt for Twilio credentials
echo "📋 Please provide your Twilio credentials:"
echo ""
read -p "Twilio Account SID: " TWILIO_ACCOUNT_SID
read -p "Twilio Auth Token: " TWILIO_AUTH_TOKEN
read -p "Twilio Verify Service SID: " TWILIO_VERIFY_SERVICE_SID
read -p "Twilio WhatsApp From (optional, default: whatsapp:+14155238886): " TWILIO_WHATSAPP_FROM
TWILIO_WHATSAPP_FROM="${TWILIO_WHATSAPP_FROM:-whatsapp:+14155238886}"
read -p "Twilio From Number for SMS (optional): " TWILIO_FROM_NUMBER
read -p "Twilio Messaging Service SID (optional): " TWILIO_MESSAGING_SERVICE_SID
read -p "Twilio WhatsApp Template SID (optional): " TWILIO_WHATSAPP_TEMPLATE_SID

echo ""
echo "🔄 Configuring Twilio credentials on server..."

# Execute on server
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << EOF
set -e

REMOTE_DIR="$REMOTE_DIR"
cd "\$REMOTE_DIR" || exit 1

echo "📍 Current directory: \$(pwd)"

# Backup existing .env if it exists
if [ -f .env ]; then
    echo "📋 Backing up existing .env file..."
    cp .env .env.backup.\$(date +%Y%m%d_%H%M%S)
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating new .env file..."
    touch .env
fi

# Function to set or update env variable
set_env_var() {
    local var_name=\$1
    local var_value=\$2
    local file=.env
    
    # Remove old entry if exists
    sed -i "/^\\\${var_name}=/d" "\$file" 2>/dev/null || true
    
    # Add new entry
    echo "\${var_name}=\${var_value}" >> "\$file"
}

# Set Twilio variables
echo "🔧 Adding Twilio credentials to .env file..."

# Remove any existing Twilio variables
sed -i '/^TWILIO_/d' .env 2>/dev/null || true
sed -i '/^OTP_/d' .env 2>/dev/null || true

# Add Twilio variables
echo "" >> .env
echo "# ========================================" >> .env
echo "# TWILIO WHATSAPP (OTP) CONFIGURATION" >> .env
echo "# ========================================" >> .env
EOF

# Add variables with values
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << EOF
cd $REMOTE_DIR

cat >> .env << TWILIO_EOF

TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID=$TWILIO_VERIFY_SERVICE_SID
TWILIO_WHATSAPP_FROM=$TWILIO_WHATSAPP_FROM
TWILIO_FROM_NUMBER=$TWILIO_FROM_NUMBER
TWILIO_MESSAGING_SERVICE_SID=$TWILIO_MESSAGING_SERVICE_SID
TWILIO_WHATSAPP_TEMPLATE_SID=$TWILIO_WHATSAPP_TEMPLATE_SID

# OTP Configuration
OTP_TOKEN_SECRET=\$(openssl rand -hex 32 2>/dev/null || echo "generate-a-random-32-char-secret-here")
OTP_TOKEN_EXPIRES_IN=10m
OTP_EXPIRY_MINUTES=5
OTP_CHANNEL=whatsapp
OTP_PROVIDER=verify
TWILIO_EOF

echo "✅ Twilio credentials added to .env file"
echo ""
echo "📋 Verification:"
echo "Twilio variables in .env:"
grep "^TWILIO_\|^OTP_" .env | sed 's/=.*/=***HIDDEN***/'
EOF

echo ""
echo "🔄 Restarting PM2 with new environment variables..."

ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << 'RESTARTEOF'
cd /home/ubuntu/apps/customer-support

echo "🛑 Stopping PM2 processes..."
pm2 stop all || true

echo "🚀 Starting PM2 with updated environment..."
pm2 start ecosystem.config.cjs --update-env

pm2 save

echo ""
echo "✅ PM2 restarted with new environment variables"
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📊 Recent logs (checking for Twilio initialization):"
sleep 2
pm2 logs --lines 10 --nostream | grep -i "twilio\|error\|running" | tail -10 || true
RESTARTEOF

echo ""
echo "✅ Twilio credentials configured successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Verify server is running: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 status'"
echo "2. Check logs: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 logs --lines 50'"
echo "3. Test OTP endpoint: POST /otp/send"
echo ""
echo "🔍 Where to find Twilio credentials:"
echo "1. Login to Twilio Console: https://console.twilio.com"
echo "2. Account SID & Auth Token: Dashboard → Account Info"
echo "3. Verify Service SID: Verify → Services → Your Service → SID"
echo "4. WhatsApp From: Messaging → Try it out → Send a WhatsApp message"
echo "5. Messaging Service: Messaging → Services → Your Service"
echo ""

