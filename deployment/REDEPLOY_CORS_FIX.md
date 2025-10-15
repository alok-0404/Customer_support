# CORS Fix Deployment Commands

## On your EC2 server, run these commands:

### 1. Stop the current application
```bash
pm2 stop customer-support-api
```

### 2. Backup current deployment (optional but recommended)
```bash
cp -r /home/ubuntu/customer-support /home/ubuntu/customer-support-backup-$(date +%Y%m%d_%H%M%S)
```

### 3. Update the application files
```bash
cd /home/ubuntu/customer-support

# Copy new files from deployment folder
# (Upload the updated deployment/ folder to your server)

# Install any new dependencies
npm install
```

### 4. Restart the application
```bash
pm2 restart customer-support-api
```

### 5. Check the application status
```bash
pm2 status
pm2 logs customer-support-api --lines 50
```

### 6. Test CORS
```bash
# Test if CORS is working
curl -H "Origin: http://client-support01.s3-website-us-east-1.amazonaws.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:4000/search

# Should return headers like:
# Access-Control-Allow-Origin: http://client-support01.s3-website-us-east-1.amazonaws.com
```

## What was fixed:
1. Added client frontend URL to CORS_WHITELIST in ecosystem.config.js
2. Added both HTTP and HTTPS versions of the frontend URL
3. Added the server IP address to CORS whitelist for direct access

## Environment Variables Updated:
- CORS_WHITELIST now includes:
  - http://client-support01.s3-website-us-east-1.amazonaws.com
  - https://client-support01.s3-website-us-east-1.amazonaws.com
  - http://44.221.30.127
  - https://44.221.30.127
