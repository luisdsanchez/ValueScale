# 🧪 Testing Resources for Auto-Update Feature

## Overview

Three easy ways to test the auto-update feature without needing to set up GitHub releases.

## 1️⃣ Visual Preview (TEST_UPDATE_PREVIEW.html)

**What:** Interactive browser-based preview of the notification UI

**How to use:**
1. Double-click `TEST_UPDATE_PREVIEW.html` 
2. Opens in your default browser
3. Click buttons to see different states

**What you'll see:**
- Exact notification design
- Smooth slide-in animation
- Color scheme and styling
- Button interactions
- Responsive layout

**States to test:**
- "Show Update Available" - New version detected
- "Show Update Downloaded" - Ready to install
- "Later" button - Dismiss notification
- "Show Error Message" - Network error handling

**Time:** 1-2 minutes  
**Prerequisites:** Web browser only  
**Benefits:** See exactly what users will see

---

## 2️⃣ Automated Tests (test-auto-updater.js)

**What:** Unit tests for the update logic

**How to use:**
```bash
node test-auto-updater.js
```

**What it tests:**
1. Version comparison (5 tests)
   - 1.2.2 → 1.2.3 (should update ✓)
   - 1.2.2 → 1.2.2 (should not update ✓)
   - 1.0.0 → 2.0.0 (major update ✓)
   
2. Release data parsing
   - Extracts version from GitHub response
   - Gets download URL correctly
   - Parses release notes

3. Version validation (6 tests)
   - Valid formats: 1.2.3, v1.2.3, 1.2.3-beta
   - Invalid formats: "invalid", "1.2", ""

4. Update check simulation
   - Detects available updates
   - Maintains current version when up-to-date
   - Prevents downgrades

5. Configuration validation
   - GitHub repository settings
   - Check interval (1 hour default)
   - API endpoints

**Expected output:**
```
✓ PASS: 1.2.2 → 1.2.3 (should update: true)
✓ PASS: Release parsed successfully
✓ PASS: "1.2.3" is valid semver
...
✅ All tests completed successfully!
```

**Time:** 5 seconds  
**Prerequisites:** Node.js (already installed)  
**Benefits:** Verifies all logic is correct, 11 tests pass ✓

---

## 3️⃣ Real App Test (Full Integration)

**What:** Test the auto-updater with a real GitHub release

**Prerequisites:**
- GitHub account
- Build tools installed
- Understand semantic versioning

**Setup steps:**

1. **Update version**
   ```bash
   # Edit package.json
   "version": "1.2.3"
   ```

2. **Build the app**
   ```bash
   npm run dist:portable
   ```
   Creates: `dist/ValueScale_1.2.3.exe`

3. **Create GitHub release**
   - Go to: https://github.com/luisdsanchez/ValueScale/releases
   - Click: "Draft a new release"
   - Tag: `v1.2.3` (must start with v)
   - Title: `ValueScale 1.2.3`
   - Description: Add release notes
   - Upload: `ValueScale_1.2.3.exe` from dist folder
   - Publish: Click "Publish release"

4. **Wait for GitHub to process** (1-2 minutes)

5. **Start the app**
   ```bash
   npm start
   ```

6. **Watch for notification**
   - Should appear in 2-3 seconds
   - Shows version 1.2.3 available
   - Display: "Update Available" with Install/Later buttons

7. **Test installation**
   - Click "Install Now"
   - Installer should launch
   - App should restart with new version

8. **Verify**
   - After restart, app shows version 1.2.3
   - Settings are preserved
   - App works normally

**Testing "Later" button:**
- Dismiss notification
- Notification won't appear again until app restart
- Next startup will check again

**Time:** 5-10 minutes setup + 2 minutes test  
**Prerequisites:** GitHub account, build tools, patience  
**Benefits:** Full end-to-end test, see real update flow

---

## Comparison

| Feature | Visual Preview | Automated Tests | Real App Test |
|---------|---|---|---|
| Time needed | 1-2 min | 5 sec | 10-15 min |
| Browser only | ✓ | ✗ | ✗ |
| No GitHub needed | ✓ | ✓ | ✗ |
| Tests UI design | ✓ | ✗ | ✓ |
| Tests logic | ✗ | ✓ | ✓ |
| Tests full flow | ✗ | ✗ | ✓ |
| Shows animations | ✓ | ✗ | ✓ |
| Requires build | ✗ | ✗ | ✓ |

---

## Recommended Testing Path

### Quick Test (5 minutes)
1. Open `TEST_UPDATE_PREVIEW.html` in browser
2. Click "Show Update Available"
3. See the notification UI

### Complete Test (20 minutes)
1. Open `TEST_UPDATE_PREVIEW.html` - See the design
2. Run `node test-auto-updater.js` - Verify logic
3. Create GitHub release with v1.2.3 tag
4. Start app with `npm start`
5. See real notification
6. Click "Install Now"
7. Watch app restart

### Full Validation (30+ minutes)
1. Test all three above
2. Test "Later" button (dismiss)
3. Create v1.2.4 release
4. Verify notification appears again
5. Test on different system (if available)
6. Verify settings preserved after update

---

## Troubleshooting Tests

### Visual Preview Not Opening
- File might be blocked by Windows
- Right-click → Properties → Unblock
- Or open in browser manually

### Automated Tests Fail
- Ensure Node.js is installed: `node --version`
- Ensure semver is installed: `npm list semver`
- Run from project directory

### Real App Test
- Notification doesn't appear?
  - Check DevTools console (F12) for errors
  - Verify GitHub release has correct tag (v1.2.3)
  - Verify .exe file is attached to release
  
- Installation fails?
  - Ensure temp folder has write permissions
  - Check disk space
  - Try again (might be network issue)

---

## Files Reference

| File | Size | Purpose |
|------|------|---------|
| `TEST_UPDATE_PREVIEW.html` | 11 KB | Interactive UI demo |
| `test-auto-updater.js` | 6 KB | Automated unit tests |
| `TESTING_GUIDE.md` | 10 KB | Detailed testing docs |

---

## What to Look For

### In Visual Preview
✓ Notification appears centered  
✓ Smooth slide-in animation  
✓ Text is readable  
✓ Buttons are clickable  
✓ Color matches app theme (orange accent)

### In Automated Tests
✓ All 11 tests pass  
✓ Version comparison works correctly  
✓ Release parsing succeeds  
✓ Validation catches invalid versions  

### In Real App
✓ Notification appears 2-3 seconds after startup  
✓ Shows correct version number  
✓ "Install Now" triggers download  
✓ App restarts with new version  
✓ Settings preserved after update  

---

## Success = All Tests Pass ✅

After testing, the auto-update feature is ready for production deployment.

---

## Next Steps

After successful testing:
1. Push code to GitHub
2. Create v1.2.3 release for real users
3. Users will see update notification automatically
4. Monitor for any issues
5. Plan next release cycle

---

**Have Questions?** See:
- `TESTING_GUIDE.md` - Comprehensive testing documentation
- `AUTO_UPDATE_GUIDE.md` - Technical implementation details
- `USAGE_GUIDE.md` - Deployment guide
