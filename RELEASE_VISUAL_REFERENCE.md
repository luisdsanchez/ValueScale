# Release Process Visual Reference

Quick visual guide for releasing ValueScale to GitHub.

## 🎯 Release Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      RELEASE PREPARATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📝 UPDATE FILES                                                 │
│  ├─ package.json (version 1.2.2)                                │
│  ├─ RELEASE_NOTES.md (features, fixes)                          │
│  └─ CHANGELOG.md (new version entry)                            │
│                                                                   │
│  🧪 TEST                                                         │
│  ├─ Run: npm start                                              │
│  ├─ Verify features work                                        │
│  └─ Confirm settings persist                                    │
│                                                                   │
│  🔨 BUILD                                                        │
│  ├─ Run: npm install                                            │
│  ├─ Run: npm run dist:portable                                  │
│  └─ Verify: dist/ValueScale_1.2.2.exe exists                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      VERSION CONTROL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🏷️  CREATE TAG                                                  │
│  git tag -a v1.2.2 -m "Release version 1.2.2"                   │
│                                                                   │
│  📤 PUSH TAG                                                     │
│  git push origin v1.2.2                                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   GITHUB RELEASE (WEB)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🌐 OPEN: github.com/[user]/posterize-window/releases           │
│                                                                   │
│  📋 FILL FORM                                                    │
│  ├─ Tag: v1.2.2                                                 │
│  ├─ Title: ValueScale v1.2.2                                    │
│  ├─ Description: [Copy from RELEASE_NOTES.md]                   │
│  └─ Asset: Upload dist/ValueScale_1.2.2.exe                     │
│                                                                   │
│  ✅ PUBLISH                                                      │
│  └─ Click "Publish release"                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      VERIFICATION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ✅ Check release page loaded                                    │
│  ✅ Verify all details display correctly                         │
│  ✅ Test download link                                          │
│  ✅ Confirm "Latest release" is marked                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      POST-RELEASE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📢 ANNOUNCE                                                     │
│  ├─ Social media (Twitter, Discord, etc.)                       │
│  └─ Community channels                                          │
│                                                                   │
│  📚 DOCUMENTATION                                                │
│  ├─ Update CHANGELOG.md                                         │
│  └─ Bump version for next release                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 GitHub Release Form Reference

```
╔═══════════════════════════════════════════════════════════════════╗
║                 GitHub Release Form Template                      ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║ 🏷️  Tag version:  [v1.2.2] ▼                                     ║
║                                                                   ║
║ 📝 Release title:                                                 ║
║    ┌─────────────────────────────────────────────────────────┐  ║
║    │ ValueScale v1.2.2                                       │  ║
║    └─────────────────────────────────────────────────────────┘  ║
║                                                                   ║
║ 📄 Describe this release:                                         ║
║    ┌─────────────────────────────────────────────────────────┐  ║
║    │ # Release Notes - ValueScale v1.2.2                     │  ║
║    │                                                         │  ║
║    │ ## Overview                                             │  ║
║    │ [Brief summary of features and improvements]            │  ║
║    │                                                         │  ║
║    │ ## ✨ Features                                          │  ║
║    │ - Value warnings with customizable thresholds           │  ║
║    │ - Saturation gradient visualization                     │  ║
║    │ - [Additional features]                                 │  ║
║    │                                                         │  ║
║    │ [See RELEASE_NOTES.md for full template]                │  ║
║    └─────────────────────────────────────────────────────────┘  ║
║                                                                   ║
║ 📎 Attach binaries:                                               ║
║    ┌─────────────────────────────────────────────────────────┐  ║
║    │ [Drag files here or select them]                        │  ║
║    │ 📁 ValueScale_1.2.2.exe (120.5 MB)                      │  ║
║    └─────────────────────────────────────────────────────────┘  ║
║                                                                   ║
║ ☐ This is a pre-release                                           ║
║ ☑ Set as the latest release                                       ║
║                                                                   ║
║                                 [ Publish release ] [ Save draft ]║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

## 🔧 Command Reference

### Build & Test
```bash
# Install dependencies
npm install

# Run for testing
npm start

# Build the executable
npm run dist:portable

# Verify build
dir dist\ValueScale_*.exe
```

### Git Tagging
```bash
# Create annotated tag
git tag -a v1.2.2 -m "Release version 1.2.2"

# View created tag
git tag -l v1.2.2

# Push tag to GitHub
git push origin v1.2.2

# Delete tag if needed
git tag -d v1.2.2                    # Local delete
git push origin --delete v1.2.2      # Remote delete
```

## ✅ Checklist Matrix

```
PREPARATION PHASE
├─ [ ] Code tested and working
├─ [ ] npm run dist:portable succeeds
├─ [ ] dist/ValueScale_*.exe exists
├─ [ ] RELEASE_NOTES.md customized
├─ [ ] CHANGELOG.md updated
└─ [ ] No uncommitted changes

VERSION CONTROL PHASE
├─ [ ] Git tag created: v1.2.2
├─ [ ] Git tag pushed to origin
└─ [ ] Verify tag on GitHub

GITHUB RELEASE PHASE
├─ [ ] Release page form filled
├─ [ ] Title: "ValueScale v1.2.2"
├─ [ ] Description: Pasted from RELEASE_NOTES.md
├─ [ ] Asset uploaded: ValueScale_1.2.2.exe
├─ [ ] "Latest release" checkbox marked
└─ [ ] Release published

VERIFICATION PHASE
├─ [ ] Release page loads correctly
├─ [ ] Download link works
├─ [ ] File is correct size (~120 MB)
├─ [ ] Release marked as "Latest"
└─ [ ] All details display properly
```

## 🐛 Troubleshooting Decision Tree

```
Issue: Build failed
├─ Solution 1: npm install
├─ Solution 2: Check Node.js version
└─ Solution 3: Delete node_modules and retry

Issue: Tag already exists
├─ Solution: Delete and recreate
│  git push origin --delete v1.2.2
│  git tag -d v1.2.2
│  git tag -a v1.2.2 -m "Release v1.2.2"
│  git push origin v1.2.2
└─ See: GITHUB_RELEASE_GUIDE.md

Issue: Can't upload file to GitHub
├─ Solution 1: Try uploading again (rate limit?)
├─ Solution 2: Check file size is reasonable
├─ Solution 3: Try uploading later
└─ Solution 4: Edit release and try again

Issue: Wrong info in release
├─ Solution: Edit release (pencil icon)
│  - Don't delete the release
│  - Just edit the description/title
│  - Save changes
└─ See: GITHUB_RELEASE_GUIDE.md

Issue: Need to change version
├─ Solution: Edit AFTER publishing
│  1. Update package.json locally
│  2. Commit: git commit -m "version bump"
│  3. Push: git push
│  4. DON'T create new release for same tag
└─ For next release, increment version
```

## ⏱️ Time Estimates

```
Task                              Time        Complexity
─────────────────────────────────────────────────────────
Read documentation                5-20 min    Low
Follow RELEASE_CHECKLIST.md        30-60 min   Low
Build executable                  5-10 min    Low
Create git tag                     2 min       Low
Create GitHub release              5-10 min    Low
Test release                       5-10 min    Low
─────────────────────────────────────────────────────────
TOTAL (first release)              60-110 min  Low
TOTAL (subsequent releases)        20-30 min   Low
```

## 🎯 Success Criteria

| Criterion | How to Verify | Status |
|-----------|---------------|--------|
| Executable built | File exists: `dist/ValueScale_*.exe` | ✓ Check |
| Git tag created | Run: `git tag -l v1.2.2` | ✓ Check |
| Release published | Visit: GitHub releases page | ✓ Check |
| Download works | Click asset on release page | ✓ Check |
| Latest marked | "Latest" badge visible | ✓ Check |
| Details correct | Release page shows all info | ✓ Check |

## 📱 Mobile/Phone Checklist

If you need to release on-the-go:

```
☐ Have release notes prepared (copy from RELEASE_NOTES.md)
☐ Have built executable (dist/ValueScale_*.exe)
☐ Have git tag created (from Windows/Mac machine)
☐ Phone: Open GitHub app or website
☐ Phone: Navigate to Releases tab
☐ Phone: Create new release
☐ Phone: Select tag v1.2.2
☐ Phone: Paste title and description
☐ Phone: Note - file upload may be difficult on mobile
       → Consider using desktop for file upload
       → Or upload from GitHub web interface
☐ Phone: Publish release
☐ Phone: Verify release page looks correct
```

## 🎓 Key Concepts

```
GIT TAG
├─ Lightweight: Just a pointer to a commit
│  git tag v1.2.2
│
└─ Annotated: Contains metadata (message, author, date)
   git tag -a v1.2.2 -m "Release message"
   ✓ RECOMMENDED for releases

GITHUB RELEASE
├─ Built on top of git tags
├─ Adds release notes
├─ Allows file uploads (assets)
├─ Marks as "Latest" or "Pre-release"
└─ Creates downloadable archive

SEMANTIC VERSIONING
├─ X.Y.Z (Major.Minor.Patch)
├─ X changes: Breaking changes
├─ Y changes: New features (non-breaking)
└─ Z changes: Bug fixes only

ASSETS
├─ Downloadable files attached to release
├─ Typically: Compiled binaries, installers, archives
├─ For ValueScale: ValueScale_1.2.2.exe
└─ Users download directly from release page
```

---

**Reference Guide for:** ValueScale v1.2.2  
**Last Updated:** 2026-11-25  
**For:** GitHub Release Process
