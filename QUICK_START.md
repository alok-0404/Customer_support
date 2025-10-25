# 🚀 Quick Start Guide - SSL Setup

## Step 1: Copy Script to EC2

```bash
# From your local machine
scp -i your-key.pem setup-ssl.sh ec2-user@44.221.30.127:~/
```

## Step 2: SSH into EC2

```bash
ssh -i your-key.pem ec2-user@44.221.30.127
```

## Step 3: Run Script

```bash
chmod +x setup-ssl.sh
./setup-ssl.sh
```

## What Script Does:

✅ Updates system packages
✅ Installs Nginx
✅ Installs Certbot (SSL certificate tool)
✅ Configures firewall
✅ Gets SSL certificate from Let's Encrypt
✅ Sets up Nginx as reverse proxy
✅ Configures HTTPS for your domain
✅ Restarts services

## After Script Completes:

1. ✅ Backend will be accessible at: `https://mydiamond99clientsupport.in`
2. ✅ No more SSL errors
3. ✅ Mobile browser will work properly

## Troubleshooting:

### If script fails:
```bash
# Check logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Check if Nginx is running
sudo systemctl status nginx
```

### If domain is not verified:
Make sure DNS A record points to: `44.221.30.127`

## Manual Steps (If Script Fails):

See `SSL_SETUP_GUIDE.md` for detailed manual steps.

---

**That's it!** After running the script, your backend will have HTTPS support. 🎉
