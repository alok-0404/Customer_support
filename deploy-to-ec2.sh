#!/bin/bash

# Deploy latest code to EC2
# This script will update the backend on EC2 with latest changes

echo "🚀 Deploying to EC2..."

KEY_FILE="customer-support-backend.pem"
EC2_IP="44.221.30.127"
EC2_USER="ec2-user"
REMOTE_DIR="/home/ec2-user/customer-support"

# Check if key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Error: SSH key file '$KEY_FILE' not found"
    echo "Please ensure the key file exists in the current directory"
    exit 1
fi

# Test SSH connection
echo "🔍 Testing SSH connection..."
ssh -i "$KEY_FILE" -o ConnectTimeout=10 "$EC2_USER@$EC2_IP" "echo '✅ SSH connection successful'" || {
    echo "❌ Failed to connect to EC2"
    echo "Make sure:"
    echo "1. The key file exists: $KEY_FILE"
    echo "2. The EC2 instance is running"
    echo "3. Your IP is allowed in security group"
    exit 1
}

# Deploy via SSH
echo "📦 Starting deployment..."
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_IP" << 'DEPLOYEOF'
    set -e  # Exit on any error
    
    echo "📍 Current directory: $(pwd)"
    
    # Navigate to deployment directory
    if [ -d "/home/ec2-user/customer-support" ]; then
        cd /home/ec2-user/customer-support
        echo "📂 Found existing deployment at: $(pwd)"
        
        # Stop PM2
        echo "🛑 Stopping PM2 processes..."
        pm2 stop all || true
        
        # Backup current deployment
        echo "📋 Creating backup..."
        cd /home/ec2-user
        if [ -d "customer-support" ]; then
            mv customer-support customer-support-backup-$(date +%Y%m%d_%H%M%S)
        fi
        
        # Create new deployment directory
        mkdir -p customer-support
        cd customer-support
        
        # Pull from git (if using git)
        if command -v git &> /dev/null; then
            echo "📥 Pulling latest code from git..."
            git clone https://github.com/alok-0404/Customer_support.git . || true
            git pull origin main || true
        fi
        
        # Copy source files (if not using git)
        echo "📂 Setting up source files..."
        
        # Create logs directory
        mkdir -p logs
        
        echo "✅ Deployment directory ready"
    else
        echo "⚠️  No existing deployment found. Creating new one..."
        mkdir -p /home/ec2-user/customer-support
        cd /home/ec2-user/customer-support
        mkdir -p logs
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install --production
    
    # Start with PM2
    echo "🚀 Starting application with PM2..."
    pm2 start ecosystem.config.cjs
    pm2 save
    
    # Show status
    echo ""
    echo "✅ Deployment completed!"
    pm2 status
    
    echo ""
    echo "📊 Recent logs:"
    pm2 logs --lines 20 --nostream
DEPLOYEOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Check logs: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 logs customer-support-api --lines 50'"
echo "2. Monitor: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 monit'"
echo "3. Restart if needed: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 restart all'"

