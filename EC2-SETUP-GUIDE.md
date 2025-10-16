# 🚀 AWS EC2 Deployment Guide
## Customer Support Backend

### **Step 1: Create EC2 Instance**

1. **Login to AWS Console**
   - Go to: https://aws.amazon.com/console/
   - Login with your credentials

2. **Launch EC2 Instance**
   - Go to EC2 Dashboard
   - Click "Launch Instance"
   - **Name:** customer-support-backend
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type:** t2.micro (Free tier)
   - **Key Pair:** Create new or use existing
   - **Security Group:** Create new with these rules:
     - SSH (22) - Your IP
     - HTTP (80) - Anywhere (0.0.0.0/0)
     - HTTPS (443) - Anywhere (0.0.0.0/0)
     - Custom TCP (4000) - Anywhere (0.0.0.0/0)

3. **Launch Instance**
   - Review and click "Launch Instance"
   - Download key pair (.pem file)

### **Step 2: Connect to EC2**

```bash
# Make key file secure
chmod 400 your-key.pem

# Connect to instance
ssh -i your-key.pem ubuntu@YOUR-EC2-PUBLIC-IP
```

### **Step 3: Install Dependencies on EC2**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install PM2 startup script
pm2 startup
# Copy the command it gives you and run it with sudo
```

### **Step 4: Upload Your Code**

**Option A: Using SCP (Recommended)**
```bash
# From your local machine (in Customer_support directory)
scp -i your-key.pem -r deployment/ ubuntu@YOUR-EC2-IP:/home/ubuntu/
```

**Option B: Using Git**
```bash
# On EC2 instance
cd /home/ubuntu
git clone https://github.com/your-username/your-repo.git
cd your-repo
# Copy files from deployment/ folder
```

### **Step 5: Deploy Application**

```bash
# On EC2 instance
cd /home/ubuntu/deployment

# Install dependencies
npm install

# Create logs directory
mkdir -p logs

# Test the application
npm start

# If working, stop it (Ctrl+C) and start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

### **Step 6: Configure Nginx (Optional but Recommended)**

```bash
# Install Nginx
sudo apt install nginx -y

# Create configuration
sudo nano /etc/nginx/sites-available/customer-support

# Add this content:
server {
    listen 80;
    server_name YOUR-DOMAIN-OR-EC2-IP;

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
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### **Step 7: Configure Firewall**

```bash
# Allow required ports
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 4000

# Enable firewall
sudo ufw enable
```

### **Step 8: Test Your Deployment**

1. **Direct API Test:**
   ```
   http://YOUR-EC2-IP:4000/health
   ```

2. **Through Nginx:**
   ```
   http://YOUR-EC2-IP/
   ```

3. **Test API Endpoints:**
   ```bash
   curl http://YOUR-EC2-IP:4000/health
   curl -X POST http://YOUR-EC2-IP:4000/auth/forgot-password \
        -H "Content-Type: application/json" \
        -d '{"email": "workofficial0908@gmail.com"}'
   ```

### **Step 9: SSL Certificate (Optional)**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com
```

### **Useful Commands**

```bash
# Check application status
pm2 status

# View logs
pm2 logs customer-support-api

# Restart application
pm2 restart customer-support-api

# Monitor application
pm2 monit

# Check Nginx status
sudo systemctl status nginx

# Check if ports are listening
sudo netstat -tlnp | grep :4000
```

### **Environment Variables to Update**

In `/home/ubuntu/deployment/.env`:
```bash
# Update these values
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### **Troubleshooting**

1. **Application not starting:**
   ```bash
   pm2 logs customer-support-api
   ```

2. **Port not accessible:**
   ```bash
   sudo ufw status
   sudo netstat -tlnp | grep :4000
   ```

3. **Database connection issues:**
   - Check MongoDB Atlas IP whitelist
   - Verify MONGO_URI in .env

4. **Email not working:**
   - Verify SendGrid credentials
   - Check EMAIL_FROM is verified

### **Cost Estimation**

- **EC2 t2.micro:** Free (12 months)
- **Data Transfer:** ~$0.09/GB
- **Total Monthly Cost:** ~$0-5 (depending on usage)

### **Next Steps**

1. ✅ Backend deployed and working
2. 🔄 Deploy Frontend
3. 🔄 Configure Domain (optional)
4. 🔄 Set up monitoring (optional)

---

**🎉 Congratulations! Your backend is now live on AWS EC2!**

**API Base URL:** `http://YOUR-EC2-IP:4000`
**Health Check:** `http://YOUR-EC2-IP:4000/health`
