#!/bin/bash

# ========================================
# AWS EC2 Deployment Script
# Customer Support Backend
# ========================================

echo "🚀 Starting AWS EC2 Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "NPM is not installed"
        exit 1
    fi
    
    print_status "All dependencies are installed ✅"
}

# Build the application
build_app() {
    print_status "Building application..."
    
    # Install dependencies
    npm install --production
    
    # Build if needed (for TypeScript projects)
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        npm run build
    fi
    
    print_status "Application built successfully ✅"
}

# Create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."
    
    # Create deployment directory
    mkdir -p deployment
    
    # Copy necessary files
    cp -r src/ deployment/
    cp package*.json deployment/
    cp production.env deployment/.env
    cp nodemon.json deployment/ 2>/dev/null || true
    
    # Create production package.json
    cat > deployment/package.json << EOF
{
  "name": "customer-support-backend",
  "version": "1.0.0",
  "description": "Customer Support Backend API",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "express-mongo-sanitize": "^2.2.0",
    "xss-clean": "^0.1.4",
    "hpp": "^0.2.3",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.7",
    "zod": "^3.22.4",
    "express-rate-limit": "^7.1.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

    print_status "Deployment package created ✅"
}

# Create PM2 ecosystem file for production
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    # Copy the updated ecosystem config: prefer .cjs if present, else fallback to deployment/ecosystem.config.js
    if [ -f "ecosystem.config.cjs" ]; then
        cp ecosystem.config.cjs deployment/
    elif [ -f "ecosystem.config.js" ]; then
        cp ecosystem.config.js deployment/
    elif [ -f "deployment/ecosystem.config.js" ]; then
        cp deployment/ecosystem.config.js deployment/
    else
        print_warning "No ecosystem.config.* found. PM2 start command may fail unless provided on server."
    fi

    print_status "PM2 configuration created ✅"
}

# Create deployment instructions
create_deployment_instructions() {
    print_status "Creating deployment instructions..."
    
    cat > deployment/DEPLOYMENT.md << 'EOF'
# AWS EC2 Deployment Instructions

## Prerequisites
1. AWS EC2 instance running (Ubuntu 20.04+ recommended)
2. Node.js 18+ installed
3. PM2 installed globally
4. MongoDB Atlas connection working
5. SendGrid credentials configured

## Deployment Steps

### 1. Connect to EC2 Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 3. Deploy Application
```bash
# Create app directory
mkdir -p /home/ubuntu/customer-support
cd /home/ubuntu/customer-support

# Upload files (use scp or git clone)
# Copy all files from deployment/ folder here

# Install dependencies
npm install

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
```

### 4. Configure Nginx (Optional but Recommended)
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/customer-support

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

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

# Enable site
sudo ln -s /etc/nginx/sites-available/customer-support /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Configure Firewall
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow ssh
sudo ufw enable
```

### 6. SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Useful Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs customer-support-api

# Restart application
pm2 restart customer-support-api

# Stop application
pm2 stop customer-support-api

# Monitor application
pm2 monit
```

## Environment Variables
Make sure to update these in .env file:
- FRONTEND_URL: Your frontend domain
- CORS_ORIGIN: Your frontend domain
- JWT_ACCESS_SECRET: Strong secret key

## Security Notes
1. Use strong JWT_ACCESS_SECRET
2. Configure CORS properly
3. Use HTTPS in production
4. Keep dependencies updated
5. Monitor logs regularly
EOF

    print_status "Deployment instructions created ✅"
}

# Main execution
main() {
    print_status "Starting deployment preparation..."
    
    check_dependencies
    build_app
    create_deployment_package
    create_pm2_config
    create_deployment_instructions
    
    print_status "🎉 Deployment package ready!"
    print_warning "Next steps:"
    echo "1. Upload 'deployment/' folder to your EC2 instance"
    echo "2. Follow instructions in deployment/DEPLOYMENT.md"
    echo "3. Don't forget to update FRONTEND_URL in .env"
    
    print_status "Deployment package location: ./deployment/"
}

# Run main function
main "$@"
