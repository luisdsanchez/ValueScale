# Quick Release Reference

Fast summary of the release process for ValueScale.

## TL;DR - 5 Minute Release

```bash
# 1. Build the executable
npm install
npm run dist:portable

# 2. Create git tag
git tag -a v1.2.2 -m "Release version 1.2.2"
git push origin v1.2.2

# 3. Go to GitHub and create release
# https://github.com/[username]/posterize-window/releases/new
# - Select tag: v1.2.2
# - Title: ValueScale v1.2.2
# - Upload: dist/ValueScale_1.2.2.exe
# - Description: [Paste from RELEASE_NOTES.md]
# - Publish
```

## Files to Customize

Before releasing, update these with actual version and changes:

1. **RELEASE_NOTES.md** - Customize for this release
   - Update version number if changed
   - Describe new features, fixes, improvements
   - Add any breaking changes

2. **CHANGELOG.md** - Add new entry
   - Format: `## [1.2.2] - 2026-11-25`
   - Add sections: Added, Changed, Fixed, etc.

3. **package.json** - If new version
   - Update `"version": "1.2.2"`

## Directory Structure

```
posterize-window/
├── dist/
│   └── ValueScale_1.2.2.exe        ← Built executable to upload
├── CHANGELOG.md                     ← Version history (UPDATE)
├── RELEASE_NOTES.md                 ← Release details (UPDATE)
├── RELEASE_CHECKLIST.md             ← Pre-release verification
├── GITHUB_RELEASE_GUIDE.md          ← Detailed instructions
├── package.json                     ← Version number
├── main.js                          ← Application code
└── [other files]
```

## GitHub Release Fields

| Field | Value |
|-------|-------|
| **Tag** | v1.2.2 |
| **Title** | ValueScale v1.2.2 |
| **Description** | [Copy from RELEASE_NOTES.md or summary] |
| **Asset** | dist/ValueScale_1.2.2.exe |
| **Latest** | ✓ Check if newest version |
| **Pre-release** | ✗ Uncheck unless beta |

## Verification Checklist

Before hitting "Publish":
- [ ] Version in package.json updated
- [ ] RELEASE_NOTES.md describes changes
- [ ] CHANGELOG.md has new version entry
- [ ] Executable built: `dist/ValueScale_1.2.2.exe` exists
- [ ] GitHub form filled correctly
- [ ] File uploaded to release

After publishing:
- [ ] Release page shows all details
- [ ] Download link works
- [ ] Tag exists on GitHub

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Tag already exists | Delete: `git push origin --delete v1.2.2` |
| Wrong version | Edit release, don't delete (keeps tag) |
| File won't upload | Try uploading separately to release page |
| Missing details | Edit release after publishing with pencil icon |

## Next Steps After Release

1. ✅ Announce on social media/Discord
2. ✅ Update CHANGELOG.md with new unreleased section
3. ✅ Bump version in package.json for next dev cycle
4. ✅ Create next iteration entry in CHANGELOG.md

## Full Documentation

For detailed instructions, see:
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) - Complete pre-release steps
- [GITHUB_RELEASE_GUIDE.md](GITHUB_RELEASE_GUIDE.md) - Detailed GitHub release steps
- [RELEASE_NOTES.md](RELEASE_NOTES.md) - Full release notes template

---

**Version:** 1.2.2  
**Last Updated:** 2026-11-25  
**Repository:** https://github.com/[username]/posterize-window
