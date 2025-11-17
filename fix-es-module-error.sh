#!/bin/bash

# Fix ES Module Error on EC2 Server
# This script will fix the require() error in server.js

echo "🔧 Fixing ES Module Error on EC2 Server..."

# SSH Configuration (Update these with your values)
# Terminal logs show path: /home/ubuntu/apps/customer-support
KEY_FILE="${EC2_KEY_FILE:-customer-support-backend.pem}"
EC2_IP="${EC2_IP:-44.221.30.127}"
EC2_USER="${EC2_USER:-ubuntu}"
REMOTE_DIR="/home/ubuntu/apps/customer-support"

# Check if key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo "⚠️  Key file not found: $KEY_FILE"
    echo "Using default or set EC2_KEY_FILE env variable"
    echo "Attempting to connect anyway..."
fi

echo "📡 Connecting to EC2 server..."
echo "   Server: $EC2_USER@$EC2_IP"
echo "   Path: $REMOTE_DIR"

# Execute fix on server
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << 'FIXEOF'
set -e

REMOTE_DIR="/home/ubuntu/apps/customer-support"

echo "📍 Checking current directory structure..."
cd "$REMOTE_DIR" || {
    echo "❌ Directory not found: $REMOTE_DIR"
    echo "📋 Available directories in /home/ubuntu:"
    ls -la /home/ubuntu/
    exit 1
}

echo "✅ Found deployment directory: $(pwd)"
echo ""
echo "📋 Current server.js first 20 lines:"
head -n 20 src/server.js 2>/dev/null || echo "❌ src/server.js not found"

echo ""
echo "📋 Checking package.json for type field:"
grep -E '"type"' package.json || echo "⚠️  No 'type' field found in package.json"

echo ""
echo "🔍 Checking for require() in server.js:"
if grep -n "require(" src/server.js 2>/dev/null; then
    echo "❌ Found require() in server.js - this is the problem!"
else
    echo "✅ No require() found in server.js"
fi

echo ""
echo "🛑 Stopping PM2 processes..."
pm2 stop all || true

echo ""
echo "📦 Copying fresh source files from local machine..."
# This will be done via SCP in the next step

echo ""
echo "🔄 Verifying package.json has ES module type..."
if ! grep -q '"type": "module"' package.json; then
    echo "⚠️  package.json missing 'type: module', but we'll fix it in deployment"
fi

echo ""
echo "✅ Server ready for file updates"
FIXEOF

# Now copy fresh files to server
echo ""
echo "📤 Copying fresh source files to server..."

# Copy entire src directory
echo "   Copying src/ directory..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no -r src/ "$EC2_USER@$EC2_IP:$REMOTE_DIR/" || {
    echo "❌ Failed to copy src/ directory"
    exit 1
}

# Copy package.json
echo "   Copying package.json..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no package.json "$EC2_USER@$EC2_IP:$REMOTE_DIR/" || {
    echo "❌ Failed to copy package.json"
    exit 1
}

# Copy ecosystem.config.cjs
echo "   Copying ecosystem.config.cjs..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no ecosystem.config.cjs "$EC2_USER@$EC2_IP:$REMOTE_DIR/" || {
    echo "⚠️  Failed to copy ecosystem.config.cjs (may not exist)"
}

echo ""
echo "🚀 Installing dependencies and restarting on server..."

# Install and restart
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << 'RESTARTEOF'
set -e

REMOTE_DIR="/home/ubuntu/apps/customer-support"
cd "$REMOTE_DIR"

echo "📦 Installing/updating dependencies..."
npm install --production || {
    echo "⚠️  npm install had warnings, continuing..."
}

echo ""
echo "✅ Verifying server.js after copy:"
echo "First 10 lines of src/server.js:"
head -n 10 src/server.js

echo ""
echo "🔍 Checking for require() again:"
if grep -n "require(" src/server.js 2>/dev/null; then
    echo "❌ Still found require() - manual fix needed!"
    exit 1
else
    echo "✅ No require() found - file is correct!"
fi

echo ""
echo "🚀 Starting PM2 with updated files..."
pm2 delete all || true
pm2 start ecosystem.config.cjs || {
    echo "❌ PM2 start failed"
    echo "📋 Trying with update-env flag..."
    pm2 restart all --update-env || pm2 start ecosystem.config.cjs
}

pm2 save

echo ""
echo "✅ PM2 status:"
pm2 status

echo ""
echo "📊 Recent logs (last 30 lines):"
sleep 2
pm2 logs --lines 30 --nostream || true

echo ""
echo "✅ Fix completed!"
RESTARTEOF

echo ""
echo "✅ Fix script completed!"
echo ""
echo "📝 Next steps:"
echo "1. Check logs: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 logs --lines 50'"
echo "2. Monitor: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 monit'"
echo "3. Verify server: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'cd $REMOTE_DIR && head -n 20 src/server.js'"

