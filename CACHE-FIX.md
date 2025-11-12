# 🔄 Cache Fix Guide - Logo & Static Files

## Problem: Old Logo/Files Still Showing

Browser cache stores old files. Even after updating, users see old version.

## ✅ What I Fixed:

1. **Added Cache Busting** - All static files now have `?v=2` parameter
2. **Updated Logo** - Changed from icon to `logo.png` image
3. **Added Logo Styling** - Proper sizing and animation

## 📝 Files Updated:

- `public/index.html` - Added `?v=2` to all resources
- `public/styles.css` - Added `.logo-image` styling

## 🚀 Deploy Changes:

```bash
# 1. Commit changes
git add .
git commit -m "Add logo and fix browser cache with versioning"

# 2. Push to GitHub
git push origin main

# 3. Wait 2-3 minutes for Render to deploy
```

## 🧹 Clear Browser Cache:

### For Users Visiting Your Site:

**Chrome/Edge:**
- Press `Ctrl + Shift + Delete` (Windows)
- Press `Cmd + Shift + Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"

**Or Hard Refresh:**
- `Ctrl + F5` (Windows)
- `Cmd + Shift + R` (Mac)

### For You (Developer):

**Option 1: Hard Refresh**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

**Option 2: Clear Cache in DevTools**
1. Open DevTools (F12)
2. Right-click on refresh button
3. Select "Empty Cache and Hard Reload"

**Option 3: Incognito/Private Window**
- Open in incognito mode to see fresh version

## 🔢 Version Management:

Every time you update static files, increment the version:

### Current Version: `?v=2`

### Next Update:
Change all `?v=2` to `?v=3` in `index.html`:

```html
<link rel="icon" href="logo.png?v=3">
<link rel="stylesheet" href="styles.css?v=3">
<script type="module" src="ui.js?v=3"></script>
<script type="module" src="board.js?v=3"></script>
<script type="module" src="client.js?v=3"></script>
```

## 📊 Verify Cache Busting Works:

### Test in Browser:

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Check file URLs - should show `?v=2`
5. Files should have status `200` (not `304 Not Modified`)

### Test Logo:

1. Visit: https://chessdict.onrender.com
2. Check if new logo appears
3. If not, hard refresh: `Ctrl + Shift + R`

## 🎨 Logo Specifications:

Current logo setup:
- **File:** `public/logo.png`
- **Display Size:** 60px height (auto width)
- **Format:** PNG (supports transparency)
- **Animation:** Float effect (3s ease-in-out)

### To Change Logo:

1. Replace `public/logo.png` with your new logo
2. Increment version in `index.html`:
   ```html
   <link rel="icon" href="logo.png?v=3">
   <img src="logo.png?v=3" alt="ChessDict Logo" class="logo-image">
   ```
3. Commit and push
4. Users will see new logo immediately (no cache)

## 🔧 Advanced: Server-Side Cache Headers

For production, add cache headers in `server.js`:

```javascript
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true
}));
```

But with `?v=X` versioning, you can cache forever:

```javascript
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '365d', // Cache for 1 year
  immutable: true
}));
```

## ✅ Checklist After Deploy:

- [ ] Logo shows correctly on homepage
- [ ] Favicon (tab icon) updated
- [ ] Hard refresh shows new version
- [ ] Incognito mode shows new version
- [ ] Mobile browser shows new version

## 🐛 Troubleshooting:

**Issue: Still showing old logo**
- Solution: Hard refresh (`Ctrl + Shift + R`)

**Issue: Logo not loading (broken image)**
- Check: Is `logo.png` in `public/` folder?
- Check: Is file committed to Git?
- Check: Render logs for file serving errors

**Issue: Logo too big/small**
- Edit `styles.css` → `.logo-image` → change `height: 60px`

---

**Remember:** Increment `?v=X` every time you update static files! 🚀
