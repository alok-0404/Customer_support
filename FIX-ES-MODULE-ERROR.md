# 🔧 ES Module Error Fix Guide

## Problem
Server pe error aa raha hai:
```
ReferenceError: require is not defined in ES module scope
    at file:///home/ubuntu/apps/customer-support/src/server.js:1:1
```

## Root Cause
- Server pe `src/server.js` file purani/corrupted hai jo `require()` use kar rahi hai
- Lekin `package.json` me `"type": "module"` hai, isliye ES modules use hone chahiye
- Proper ES modules me `import` use hota hai, `require()` nahi

## Solution

### Option 1: Automated Fix Script (Recommended)
```bash
# Script automatically fix karega
./fix-es-module-error.sh
```

Yeh script:
1. Server pe jake current file check karegi
2. Fresh `src/` folder copy karegi
3. `package.json` verify karegi
4. Dependencies install karegi
5. PM2 restart karegi

### Option 2: Manual Fix (SSH ke through)

#### Step 1: Server pe connect karein
```bash
ssh -i customer-support-backend.pem ubuntu@YOUR-EC2-IP
cd /home/ubuntu/apps/customer-support
```

#### Step 2: Current file check karein
```bash
# Dekho ki file me require() hai ya nahi
head -n 20 src/server.js
grep -n "require(" src/server.js
```

#### Step 3: Fresh files copy karein (Local machine se)
```bash
# Local machine se (project directory me)
scp -i customer-support-backend.pem -r src/ ubuntu@YOUR-EC2-IP:/home/ubuntu/apps/customer-support/
scp -i customer-support-backend.pem package.json ubuntu@YOUR-EC2-IP:/home/ubuntu/apps/customer-support/
scp -i customer-support-backend.pem ecosystem.config.cjs ubuntu@YOUR-EC2-IP:/home/ubuntu/apps/customer-support/
```

#### Step 4: Server pe dependencies install aur restart
```bash
# Server pe
cd /home/ubuntu/apps/customer-support
npm install --production
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs --lines 30
```

### Option 3: Git Pull (Agar git setup hai)
```bash
# Server pe
cd /home/ubuntu/apps/customer-support
git pull origin main
npm install --production
pm2 restart all --update-env
pm2 logs --lines 30
```

## Verification

### Check karein ki file sahi hai:
```bash
ssh -i customer-support-backend.pem ubuntu@YOUR-EC2-IP "cd /home/ubuntu/apps/customer-support && head -n 20 src/server.js"
```

### Check karein ki require() nahi hai:
```bash
ssh -i customer-support-backend.pem ubuntu@YOUR-EC2-IP "cd /home/ubuntu/apps/customer-support && grep -n 'require(' src/server.js"
```

### PM2 logs check karein:
```bash
ssh -i customer-support-backend.pem ubuntu@YOUR-EC2-IP "pm2 logs --lines 50"
```

Agar error fix ho gaya hai to logs me koi "require is not defined" error nahi aayega.

## Expected Result

Fix ke baad:
- ✅ Server start hoga without errors
- ✅ PM2 logs me "require is not defined" error nahi aayega
- ✅ Application properly run karega
- ✅ All routes accessible honge

## Troubleshooting

### Agar script fail ho:
1. SSH key file verify karein: `ls -la customer-support-backend.pem`
2. EC2 IP verify karein
3. Firewall/security group check karein
4. Server pe manually check karein

### Agar still error aaye:
1. Server pe manually file check karein
2. `package.json` verify karein ki `"type": "module"` hai
3. Node.js version check karein: `node --version` (should be 18+)
4. Full logs check karein: `pm2 logs --lines 100`

## Notes

- Server path: `/home/ubuntu/apps/customer-support`
- User: `ubuntu`
- PM2 app name: `customer-support-api`
- Port: Check `ecosystem.config.cjs` ya `.env` file

