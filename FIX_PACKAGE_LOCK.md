# Fix Package Lock Issue

## Problem
Docker build fails because `package.json` and `package-lock.json` are out of sync after adding nodemailer.

## Solution

Run this in WSL terminal (where you have npm installed):

```bash
cd /mnt/c/Users/ShamimAlam/Desktop/whatsapp_ai_bot/backend
npm install
```

This will update `package-lock.json` to include nodemailer and its dependencies.

Then rebuild Docker:

```bash
cd /mnt/c/Users/ShamimAlam/Desktop/whatsapp_ai_bot
docker-compose down
docker-compose build
docker-compose up
```

## What This Does

1. `npm install` reads `package.json` and updates `package-lock.json`
2. Docker build then uses `npm ci` which requires both files to match
3. Backend will now build successfully with nodemailer included

## Alternative: Manual Fix

If you don't want to install nodemailer right now, you can remove it from package.json:

**Option 1**: Keep nodemailer but sync lock file (RECOMMENDED)
```bash
# In WSL
cd /mnt/c/Users/ShamimAlam/Desktop/whatsapp_ai_bot/backend
npm install
```

**Option 2**: Remove nodemailer for now
Edit `backend/package.json` and remove these lines:
- `"nodemailer": "^6.9.7",` from dependencies
- `"@types/nodemailer": "^6.4.14",` from devDependencies

Then rebuild:
```bash
docker-compose down
docker-compose build
docker-compose up
```

Note: Without nodemailer, password reset emails will only log to console (development mode still works).
