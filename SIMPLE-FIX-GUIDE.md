# Simple Fix for Nginx API Issue

## Problem:
`/api/health` se HTML aa raha hai instead of JSON

## Root Cause:
**Cloudflare ya koi aur proxy sit-in ho sakta hai jo frontend serve kar raha hai.**

## Simple Solution (Step by Step):

### EC2 Par Line by Line Commands:

```bash
# Step 1: Check if backend is running
pm2 status

# Step 2: Test backend DIRECTLY (bypass nginx)
curl http://localhost:4000/health

# Step 3: Check nginx config
sudo cat /etc/nginx/sites-available/mydiamond99clientsupport.in

# Step 4: If Step 2 works but Step 3 doesn't, means issue is in nginx
```

## What You Should See:

**Step 2 Output (Expected):**
```json
{"status":"ok","timestamp":"...","message":"..."}
```

**If you see this, backend is working!**

**Then nginx config is the problem.**

## Alternative Quick Fix:

**Backend ka port direct expose karo (n no nginx):**

Frontend config change karo:
```
From: https://mydiamond99clientsupport.in/api/search
To:   https://44.221.30.127:4000/search
```

**Ya same domain but WITHOUT /api:**

```nginx
# Nginx config mein:
location /search {
    proxy_pass http://localhost:4000/search;
}
```

