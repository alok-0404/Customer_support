# Frontend-Backend Connection Setup

## 🚨 Current Problem

Frontend `https://api.mydiamond99clientsupport.in` use kar raha hai jo exist nahi karta, isliye CORS error aa raha hai.

## ✅ Solution Options

### **Option 1: Same Domain Mein API Endpoint** (RECOMMENDED)

Frontend and Backend same domain par run honge:

**Nginx Config (EC2 par add karo):**

```nginx
# /etc/nginx/sites-available/mydiamond99clientsupport.in

server {
    listen 80;
    server_name mydiamond99clientsupport.in;

    # API Proxy
    location /api {
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

    # Frontend (existing)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
```

**Frontend API URL change karo:**
```javascript
// Old:
const API_URL = 'https://api.mydiamond99clientsupport.in'

// New:
const API_URL = 'https://mydiamond99clientsupport.in/api'

// Ya direct:
const API_URL = 'https://44.221.30.127:4000'
```

### **Option 2: Direct Backend URL** (QUICKEST)

Frontend mein:

```javascript
// .env file ya config mein:
REACT_APP_API_URL=https://44.221.30.127:4000

// Phir API calls:
axios.get(`${process.env.REACT_APP_API_URL}/search?userId=${userId}`)
```

### **Option 3: Create API Subdomain** (COMPLEX)

**EC2 par yeh commands run karo:**

```bash
# Step 1: DNS mein add karo (domain provider par)
# Add A record: api.mydiamond99clientsupport.in → 44.221.30.127

# Step 2: Run configure script:
./configure-api-subdomain.sh

# Step 3: SSL certificate:
sudo certbot --nginx -d api.mydiamond99clientsupport.in

# Step 4: Test:
curl https://api.mydiamond99clientsupport.in/health
```

## 🎯 Recommended Approach

**Option 1 is best** because:
- ✅ No DNS changes needed
- ✅ Same domain = no CORS issues
- ✅ SSL already configured
- ✅ Simple to implement

## 🔧 Implementation Steps

### EC2 Par:

```bash
# 1. SSH to EC2:
ssh -i customer-support-backend.pem ec2-user@44.221.30.127

# 2. Edit nginx config:
sudo nano /etc/nginx/sites-available/mydiamond99clientsupport.in

# 3. Add /api location (see config above)

# 4. Test and reload:
sudo nginx -t
sudo systemctl reload nginx

# 5. Test API:
curl https://mydiamond99clientsupport.in/api/health
```

### Frontend Par:

```javascript
// config.js ya .env
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mydiamond99clientsupport.in/api';

// Usage:
axios.get(`${API_BASE_URL}/search`, { params: { userId } })
```

## ✅ Expected Result

After setup:
```
Frontend: https://mydiamond99clientsupport.in
Backend API: https://mydiamond99clientsupport.in/api/search?userId=CLIENT001
```

This will work without any CORS issues!

