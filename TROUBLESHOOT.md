# 🔍 Troubleshooting Guide - Render Deployment

## Current Issue: `{"success":false,"error":"Route not found"}`

## ✅ Step-by-Step Fix

### Step 1: Verify Changes Are Pushed
```bash
git status
git log --oneline -1
```
**Expected:** Should show "Fix 404 handler and static file serving"

### Step 2: Force Render to Redeploy

#### Option A: Manual Deploy (Recommended)
1. Go to: https://dashboard.render.com
2. Find your `chessdict` service
3. Click **"Manual Deploy"** button
4. Select **"Clear build cache & deploy"**
5. Wait 3-5 minutes

#### Option B: Trigger via Git
```bash
git commit --allow-empty -m "Force Render redeploy"
git push origin main
```

### Step 3: Check Render Logs

1. Go to Render Dashboard
2. Click on your service
3. Go to **"Logs"** tab
4. Look for:
   - ✅ "Build succeeded"
   - ✅ "ChessDict server running on port 10000"
   - ✅ "Server is ready to accept connections"
   - ❌ Any error messages

### Step 4: Test Endpoints

#### Test 1: Health Check
```bash
curl https://chessdict.onrender.com/health
```
**Expected:** `{"status":"ok","message":"Server is running"}`

#### Test 2: Main Page
```bash
curl -I https://chessdict.onrender.com/
```
**Expected:** Status 200, Content-Type: text/html

#### Test 3: Static File
```bash
curl -I https://chessdict.onrender.com/styles.css
```
**Expected:** Status 200, Content-Type: text/css

## 🐛 Common Issues & Solutions

### Issue 1: "Application failed to respond"
**Cause:** Free tier server goes to sleep after 15 minutes of inactivity

**Solution:**
- Wait 30-60 seconds for server to wake up
- Refresh the page
- First request after sleep is always slow

### Issue 2: Build Succeeds but Site Shows 404
**Cause:** Old build cached or deployment didn't complete

**Solution:**
```bash
# In Render Dashboard:
1. Settings → Delete Service
2. Create new service from GitHub repo
3. Use these settings:
   - Build Command: npm install
   - Start Command: npm start
   - Health Check Path: /health
```

### Issue 3: Static Files Not Loading
**Cause:** Public folder not deployed or wrong path

**Solution:**
```bash
# Verify public folder is in Git
git ls-files public/

# Should show:
# public/board.js
# public/client.js
# public/index.html
# public/styles.css
# public/ui.js
```

### Issue 4: Socket.io Not Connecting
**Cause:** CORS or transport issues

**Solution:** Already fixed in server.js with:
- `transports: ['polling', 'websocket']`
- `cors: { origin: '*' }`

## 🔧 Nuclear Option: Fresh Deploy

If nothing works, do a complete fresh deploy:

### Step 1: Delete Current Service
1. Render Dashboard → Your Service
2. Settings → Delete Service
3. Confirm deletion

### Step 2: Create New Service
1. Dashboard → New → Web Service
2. Connect GitHub repo
3. Configure:
   - **Name:** chessdict
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. Add Environment Variable:
   - **Key:** `NODE_ENV`
   - **Value:** `production`

5. Click **"Create Web Service"**

### Step 3: Wait for Deploy
- Takes 3-5 minutes
- Watch logs for "Server is ready"

### Step 4: Test
```bash
curl https://chessdict.onrender.com/health
```

## 📊 Expected Logs in Render

```
==> Building...
npm install
added 150 packages

==> Starting service...
ChessDict server running on port 10000
Environment: production
Server is ready to accept connections
```

## 🆘 Still Not Working?

### Check These:

1. **Is package.json correct?**
   ```bash
   cat package.json | grep "start"
   ```
   Should show: `"start": "node server.js"`

2. **Are all files committed?**
   ```bash
   git status
   ```
   Should show: "nothing to commit, working tree clean"

3. **Is GitHub repo updated?**
   - Go to your GitHub repo
   - Check if latest commit is there
   - Verify public folder exists

4. **Render Service Status**
   - Dashboard should show "Live" (green)
   - Not "Failed" or "Suspended"

## 📞 Get Help

If still stuck, share these details:
1. Render logs (last 50 lines)
2. Output of: `curl -I https://chessdict.onrender.com/`
3. Screenshot of Render dashboard

---

**Most Common Fix:** Manual Deploy with "Clear build cache & deploy" ✅
