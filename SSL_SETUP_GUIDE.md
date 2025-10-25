# 🔒 SSL/HTTPS Setup Guide

## Problem
Frontend `https://44.221.30.127:4000` se call kar raha hai, lekin backend HTTP par hai, isliye SSL error aa raha hai.

## ✅ Solution: Install SSL Certificate (Recommended)

### Step 1: Install Nginx on EC2

```bash
ssh ec2-user@44.221.30.127
sudo yum update -y
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 2: Install Certbot (Let's Encrypt SSL)

```bash
sudo yum install certbot python3-certbot-nginx -y
```

### Step 3: Configure Firewall

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Step 4: Get SSL Certificate

```bash
sudo certbot --nginx -d mydiamond99clientsupport.in -d www.mydiamond99clientsupport.in
```

### Step 5: Copy Nginx Config

Copy `nginx-ssl-config.conf` to server:
```bash
scp -i your-key.pem nginx-ssl-config.conf ec2-user@44.221.30.127:~
```

On server:
```bash
sudo cp ~/nginx-ssl-config.conf /etc/nginx/sites-available/customer-support
sudo ln -s /etc/nginx/sites-available/customer-support /etc/nginx/sites-enabled/
```

### Step 6: Test and Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Alternative: Quick SSL Setup (Self-Signed - Testing Only)

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt

# Update nginx config to use self-signed cert
sudo nano /etc/nginx/sites-available/customer-support
# Change cert paths to self-signed certs
```

## After SSL Setup

1. Backend ab `https://mydiamond99clientsupport.in` par accessible hoga
2. Frontend ko update karna hoga:
   ```javascript
   const API_URL = "https://mydiamond99clientsupport.in"
   ```
3. Frontend rebuild aur redeploy karo

## Benefits

✅ Secure HTTPS connections
✅ No more SSL protocol errors
✅ Professional deployment
✅ Browser security warnings removed

## Troubleshooting

### Certificate not found
```bash
ls -la /etc/letsencrypt/live/mydiamond99clientsupport.in/
```

### Nginx not starting
```bash
sudo nginx -t  # Check config
sudo journalctl -xe  # Check logs
```

### Port 443 not accessible
```bash
sudo firewall-cmd --list-all
sudo netstat -tlnp | grep 443
```
