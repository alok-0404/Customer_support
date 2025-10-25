#!/bin/bash

# Quick deployment script to fix the connection reset error
# This deploys the updated deployment folder to EC2

KEY_FILE="customer-support-backend.pem"
EC2_IP="44.221.30.127"
EC2_USER="ec2-user"
DEPLOY_DIR="/home/ec2-user/customer-support"

echo "🚀 Deploying fix to production server..."

# Create a tarball of the deployment folder
echo "📦 Creating deployment package..."
tar -czf deployment-fix.tar.gz deployment/

# Copy to EC2
echo "📤 Uploading to EC2..."
scp -i "$KEY_FILE" deployment-fix.tar.gz $EC2_USER@$EC2_IP:/tmp/

# SSH and deploy
echo "🔧 Deploying on server..."
ssh -i "$KEY_FILE" $EC2_USER@$EC2_IP << 'EOF'
  echo "Starting deployment..."
  cd /home/ec2-user
  
  # Stop PM2
  pm2 stop all || true
  
  # Backup current deployment
  if [ -d "customer-support" ]; then
    mv customer-support customer-support-backup-$(date +%Y%m%d_%H%M%S)
  fi
  
  # Extract new deployment
  tar -xzf /tmp/deployment-fix.tar.gz
  mv deployment customer-support
  
  # Install dependencies
  cd customer-support
  npm install --production
  
  # Start with PM2
  pm2 start ecosystem.config.cjs
  
  # Save PM2 config
  pm2 save
  
  # Cleanup
  rm /tmp/deployment-fix.tar.gz
  
  echo "✅ Deployment complete!"
  pm2 status
  pm2 logs --lines 50
EOF

echo "✅ Deployment complete!"
echo "Check logs with: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 logs'"

