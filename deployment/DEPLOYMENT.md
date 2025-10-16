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
pm2 start ecosystem.config.cjs

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
