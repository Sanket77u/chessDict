# Render Deployment Guide - ChessDict

## 🚀 Changes Made for Render

### 1. Server Configuration
- ✅ Added `0.0.0.0` binding for Render
- ✅ Added health check endpoint at `/health`
- ✅ Configured Socket.io with proper timeouts
- ✅ Set transports order: `['polling', 'websocket']`

### 2. Files Updated
- `server.js` - Server configuration
- `render.yaml` - Render deployment config
- `package.json` - Node version requirement

## 📝 Deployment Steps

### Option 1: Auto Deploy (Recommended)

1. **Commit and Push Changes:**
```bash
git add .
git commit -m "Fix Render deployment configuration"
git push origin main
```

2. **Render will automatically redeploy** (if auto-deploy is enabled)

### Option 2: Manual Deploy

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your `chessdict` service
3. Click "Manual Deploy" → "Deploy latest commit"

## 🔍 Troubleshooting

### If site is not loading:

1. **Check Render Logs:**
   - Go to your service dashboard
   - Click on "Logs" tab
   - Look for errors

2. **Verify Build Success:**
   - Check if build completed successfully
   - Look for "Build succeeded" message

3. **Check Health Endpoint:**
   - Visit: `https://chessdict.onrender.com/health`
   - Should return: `{"status":"ok","message":"Server is running"}`

4. **Common Issues:**

   **Issue: "Application failed to respond"**
   - Solution: Server might be sleeping (free tier). Wait 30-60 seconds and refresh.

   **Issue: "Build failed"**
   - Solution: Check if all dependencies are in `package.json`
   - Run `npm install` locally to verify

   **Issue: "Port binding error"**
   - Solution: Make sure `PORT` environment variable is set in Render dashboard

## ⚙️ Render Dashboard Settings

Make sure these are configured:

1. **Build Command:** `npm install`
2. **Start Command:** `npm start`
3. **Health Check Path:** `/health`
4. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (or let Render auto-assign)

## 🧪 Testing After Deployment

1. Visit: `https://chessdict.onrender.com`
2. Click "Create New Game"
3. Copy Game ID
4. Open in incognito/another browser
5. Join with Game ID
6. Make moves and verify real-time sync

## 📊 Monitoring

- **Logs:** Check Render dashboard logs for errors
- **Metrics:** Monitor response times in Render dashboard
- **Health:** Periodically check `/health` endpoint

## 🆘 Still Not Working?

Check these:

1. **Is the service running?**
   ```bash
   curl https://chessdict.onrender.com/health
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for connection errors
   - Check Network tab for failed requests

3. **Verify Socket.io connection:**
   - Should see "Connected to server" in console
   - Connection status should show "Connected"

## 📞 Support

If issues persist:
1. Check Render status page: https://status.render.com
2. Review Render docs: https://render.com/docs
3. Check Socket.io docs: https://socket.io/docs/v4/

---

**Last Updated:** $(date)
