# Manual EC2 Deployment Commands

Agar SSH key issue ho raha hai, to EC2 par direct ja kar yeh commands run karo:

## EC2 Par SSH Karo

```bash
# Terminal se connect karo (agar key chal rahi hai):
ssh -i customer-support-backend.pem ec2-user@44.221.30.127

# Ya agar pehle se connected ho to direct commands run karo:
```

## EC2 Par Ye Commands Run Karo

### 1. Git Pull Karo (Agar git setup hai)

```bash
cd /home/ec2-user/customer-support

# Git pull karne ke liye:
git pull origin main

# Nahi chala to full clone:
cd /home/ec2-user
rm -rf customer-support
git clone https://github.com/alok-0404/Customer_support.git customer-support
cd customer-support
```

### 2. Dependencies Install Karo

```bash
npm install --production
```

### 3. PM2 Restart Karo

```bash
pm2 restart all
pm2 save

# Status check:
pm2 status

# Logs dekho:
pm2 logs customer-support-api --lines 50
```

## Ya Puri Re-Deployment

```bash
# PM2 stop karo
pm2 stop all

# Backup banao
cd /home/ec2-user
mv customer-support customer-support-backup-$(date +%Y%m%d_%H%M%S)

# New clone karo
git clone https://github.com/alok-0404/Customer_support.git customer-support
cd customer-support

# Dependencies install karo
npm install --production

# Logs directory banao
mkdir -p logs

# Start karo
pm2 start ecosystem.config.cjs
pm2 save

# Logs dekho
pm2 logs customer-support-api --lines 50
```

## Check CORS Logs

```bash
# Real-time logs:
pm2 logs customer-support-api

# CORS specific logs:
pm2 logs customer-support-api | grep CORS

# Current environment variables:
pm2 env customer-support-api
```

## Expected Output

Agar sab sahi hai, to logs mein yeh dikhna chahiye:

```
🔍 CORS Request from origin: https://mydiamond99clientsupport.in
✅ CORS: Origin matched in whitelist
```

## Troubleshooting

### Agar PM2 not found:
```bash
sudo npm install -g pm2
pm2 startup
```

### Agar dependency errors:
```bash
rm -rf node_modules package-lock.json
npm install --production
```

### Port already in use:
```bash
pm2 delete all
pm2 start ecosystem.config.cjs
```

