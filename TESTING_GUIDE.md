# Auto-Update Feature - Testing Guide

## Quick Preview (No Setup Required)

### Option 1: Visual Preview in Browser

Open the test preview file in your browser:
```
FILE → Open → TEST_UPDATE_PREVIEW.html
```

Or simply double-click the file. You'll see:
- ✅ Exact notification design as it appears in the app
- ✅ Smooth slide-in animation
- ✅ Interactive buttons to show different states
- ✅ Responsive design demo

**What you can test:**
- Click "Show Update Available" → See the notification popup
- Click "Show Update Downloaded" → See button state change
- Click "Later" → Dismiss and clear the notification
- Click "Show Error Message" → See error handling

This shows exactly what users will see in the real app.

---

## Automated Tests (Node.js)

Run the test suite to verify all logic:

```bash
node test-auto-updater.js
```

**Tests included:**
- ✓ Version comparison (5 test cases)
- ✓ Release data parsing
- ✓ Version format validation (6 test cases)
- ✓ Update check simulation
- ✓ Configuration validation

**Expected output:**
```
🧪 ValueScale Auto-Updater Test Suite

TEST 1: Version Comparison
════════════════════════════════════════
✓ PASS: 1.2.2 → 1.2.3 (should update: true)
✓ PASS: 1.2.2 → 1.2.2 (should update: false)
✓ PASS: 1.2.3 → 1.2.2 (should update: false)
✓ PASS: 1.0.0 → 2.0.0 (should update: true)
✓ PASS: 2.3.4 → 2.3.5 (should update: true)

Result: 5/5 tests passed
...
✅ All tests completed successfully!
```

All 11 automated tests should pass ✓

---

## Full Integration Test (Real App)

### Prerequisites
- ValueScale source code
- Node.js installed
- GitHub account access

### Step-by-Step Test

#### 1. Create a Test Release on GitHub

```bash
# 1a. Update package.json version
# Change: "version": "1.2.2"
# To:     "version": "1.2.3"

# 1b. Build the app
npm run dist:portable

# 1c. Create GitHub release
# Go to: https://github.com/luisdsanchez/ValueScale/releases
# Click: "Draft a new release"
# Tag: v1.2.3
# Title: ValueScale 1.2.3
# Description: Test release for auto-update
# Upload: ValueScale_1.2.3.exe from dist/ folder
# Publish: Click "Publish release"
```

#### 2. Start the App

```bash
npm start
```

#### 3. Watch for Notification

The app will:
1. ✓ Check GitHub API automatically
2. ✓ Compare v1.2.3 (released) with v1.2.2 (current)
3. ✓ Detect update is available
4. ✓ Show notification in center of screen

#### 4. Test "Install Now"

- Click "Install Now" button
- Observe:
  - Button changes to "Installing..."
  - Installer launches
  - App restarts with new version

#### 5. Verify Installation

After restart:
- Version should be 1.2.3
- Settings should be preserved
- App should work normally

#### 6. Test "Later" Button

Create another test release (v1.2.4):
- Notification appears again
- Click "Later"
- Notification dismisses
- App continues working
- Check appears again on next app startup

---

## Testing Different Scenarios

### Scenario 1: Check for Updates Manually

**To test:**
```javascript
// Open Developer Tools (Ctrl+Shift+I)
// In console, run:
await window.api.checkForUpdates();
```

**Expected:**
- Returns `true` if update available
- Returns `false` if up to date
- Notification shows if update found

### Scenario 2: Multiple Checks

**To test:**
1. Start the app (first check runs)
2. Wait 60 minutes (or modify CHECK_INTERVAL to 10 seconds)
3. Observe: Checks run automatically every hour
4. Create new release (v1.2.5)
5. Observe: Periodic check detects it

### Scenario 3: Network Failure Handling

**To test offline behavior:**
1. Disconnect internet
2. Start the app
3. Observe: Check fails gracefully (no crash)
4. Reconnect internet
5. Wait for next check: Resumes normally

### Scenario 4: Invalid Version Tags

**To test version validation:**

Create GitHub release with invalid tag:
- Tag: `invalid` (not semver)
- Expected: Check ignores it
- Check continues to work normally

Create release with beta tag:
- Tag: `v1.2.3-beta`
- Expected: Recognized as valid semver
- Users can opt into beta updates

### Scenario 5: Pre-release Handling

**To test:**
1. Create release marked as "Pre-release"
2. Expected: Notification appears (beta users)
3. Main users can opt-in to beta

---

## Debugging

### Enable Detailed Logging

Modify `auto-updater.js` to add console logs:

```javascript
function checkForUpdates() {
  console.log('[AUTO-UPDATE] Starting check...');
  try {
    const currentVersion = getCurrentVersion();
    console.log('[AUTO-UPDATE] Current version:', currentVersion);
    // ... rest of function
  } catch (error) {
    console.log('[AUTO-UPDATE] Check failed:', error);
  }
}
```

### Monitor GitHub API Calls

Open Developer Tools Network tab (F12):
1. Check → Application → Network tab
2. Look for requests to `api.github.com`
3. Verify response contains release data

### Inspect Notification

```javascript
// In browser console:
document.getElementById('update-notification').style.display = 'block';
document.getElementById('update-notification-title').textContent
// Should show: "Update Available"
```

### Check Download Status

```bash
# In File Explorer
# Navigate to: C:\Users\[YourName]\AppData\Local\Temp
# Look for: ValueScale-update.exe
# This file should appear during update download
```

---

## Performance Testing

### Check Interval Impact

Default: Every 1 hour (3,600,000 ms)

**To test quick checks:**

Modify `auto-updater.js`:
```javascript
// Temporarily change to 10 seconds for testing
const CHECK_INTERVAL = 1000 * 10; // 10 seconds
```

**Observe:**
- App performance not impacted
- Checks run reliably
- CPU/memory usage minimal

### Download Speed

**To test:**
1. Create a large release file
2. Monitor download progress
3. App should remain responsive
4. Users can continue working

### Memory Usage

**To test:**
- Monitor memory in Task Manager
- Run app with periodic checks for 1 hour
- Memory should not leak or grow
- Expected: Stable ~200-500 MB

---

## Edge Cases

### Edge Case 1: Very Old Version

**Setup:** 
- Manually set package.json version to "0.1.0"
- Create release v1.0.0

**Expected:**
- Major version jump detected
- Update notified correctly
- Installation works

### Edge Case 2: Same Version Release

**Setup:**
- Current: 1.2.3
- Release: 1.2.3

**Expected:**
- No notification
- Silent exit (up to date)
- No false positives

### Edge Case 3: Downgrade Prevention

**Setup:**
- Current: 1.2.5
- Release: 1.2.4

**Expected:**
- No downgrade offered
- App stays at 1.2.5
- No notification

### Edge Case 4: Corrupted Release

**Setup:**
- Create release without .exe file
- Or upload wrong file type

**Expected:**
- Download fails gracefully
- Error message shown
- Retry available

### Edge Case 5: Rapid Successive Checks

**Setup:**
- Trigger multiple checks quickly
- Or restart app multiple times

**Expected:**
- No duplicate downloads
- No duplicate notifications
- Handles concurrency correctly

---

## Success Criteria

A successful test verifies:

✅ **Detection**
- App detects new releases on GitHub
- Correct version comparison
- No false positives

✅ **UI/UX**
- Notification appears centered
- Text is readable
- Buttons are clickable
- Animation is smooth

✅ **Installation**
- Download completes successfully
- Installer launches
- App restarts with new version
- Settings preserved after update

✅ **Reliability**
- Checks run on schedule
- No app crashes
- Errors handled gracefully
- Works offline (doesn't crash)

✅ **Performance**
- No noticeable lag
- Download doesn't block UI
- Memory usage stable
- Fast notification response

---

## Test Checklist

```
[ ] Visual preview (TEST_UPDATE_PREVIEW.html)
[ ] Automated tests (node test-auto-updater.js)
[ ] Manual update available check
[ ] Install Now functionality
[ ] Later/Dismiss functionality
[ ] Periodic checks (wait 1 hour or modify interval)
[ ] Version comparison (various versions)
[ ] Network failure handling
[ ] Release with invalid tag
[ ] Pre-release handling
[ ] Developer Tools console (no errors)
[ ] Memory usage monitoring
[ ] Multiple sequential updates
[ ] Settings preserved after update
```

---

## Common Issues & Solutions

### "Update not showing"
- Check GitHub has the release
- Verify tag is semantic version (v1.2.3)
- Verify .exe is attached
- Wait 1-2 minutes for GitHub to process
- Restart the app

### "Button does nothing"
- Check DevTools console for errors
- Verify semver is installed (npm list semver)
- Check temp folder has write permissions
- Try again (network might be temporarily down)

### "File not found error"
- Verify .exe was uploaded to GitHub
- Check temp folder exists
- Ensure disk has space
- Check Windows permissions

### "App crashes on check"
- Revert any manual changes
- Reinstall: `npm install`
- Check Node.js version: `node --version`
- Review console output for specific errors

---

## Sharing Test Results

If testing with others, include:
1. Screenshots of notification
2. Console output from tests
3. Version numbers tested
4. OS/Windows version
5. Any errors encountered

---

## Next Steps

After successful testing:
1. Create a "v1.2.3" release on GitHub
2. Document the release in README
3. Announce update to users
4. Monitor for any issues
5. Plan next release cycle

---

**Testing Complete?** You're ready to deploy the auto-update feature to production! 🎉

For more information, see:
- AUTO_UPDATE_GUIDE.md - Technical documentation
- USAGE_GUIDE.md - Deployment guide
- auto-updater.js - Implementation
