# GitHub Release Guide

Complete instructions for releasing ValueScale to GitHub.

## Prerequisites

- Repository is on GitHub at `https://github.com/[username]/posterize-window`
- Local git repository is configured and up-to-date
- Application is built and tested
- Release notes are prepared

## Step-by-Step Release Process

### 1. Verify Version and Build

```bash
# Check current version in package.json
cat package.json | findstr version

# Clean build directory (optional)
rmdir dist /s /q

# Build the portable executable
npm install
npm run dist:portable

# Verify the executable was created
dir dist\ValueScale_*.exe
```

### 2. Create Git Tag

Create an annotated tag for the release:

```bash
# Create the tag with a message
git tag -a v1.2.2 -m "Release version 1.2.2 - ValueScale grayscale projection"

# Verify the tag was created
git tag -l v1.2.2

# Push the tag to GitHub
git push origin v1.2.2
```

### 3. Create GitHub Release

Navigate to GitHub and create the release:

1. Go to: `https://github.com/[username]/posterize-window/releases`
2. Click **"Draft a new release"** button
3. Fill in the form:

   - **Choose a tag:** Select `v1.2.2` (or use "Create a new tag")
   - **Release title:** `ValueScale v1.2.2`
   - **Description:** Paste content from [RELEASE_NOTES.md](RELEASE_NOTES.md)
   
   _Alternatively, copy this template:_
   ```
   ## Overview
   ValueScale v1.2.2 brings [brief summary of changes].
   
   ## ✨ Features
   - Feature 1
   - Feature 2
   
   ## 🐛 Bug Fixes
   - Fix 1
   - Fix 2
   
   ## 📋 System Requirements
   - Windows 10 or later (x64)
   - No installation required
   
   See [RELEASE_NOTES.md](RELEASE_NOTES.md) for complete details.
   ```

4. **Upload Assets**
   - Click "Attach binaries by dropping them here or selecting them"
   - Select: `dist/ValueScale_1.2.2.exe`
   - Verify the file is listed under "Attach binaries"

5. **Release Settings**
   - Check **"Set as the latest release"** (if this is the most recent)
   - Uncheck **"This is a pre-release"** (unless it's a beta/RC)

6. Click **"Publish release"** to go live

## Post-Release Verification

After publishing, verify the release:

```bash
# Check that the tag exists on GitHub
git ls-remote --tags origin v1.2.2

# Verify the release page
# https://github.com/[username]/posterize-window/releases/tag/v1.2.2

# Test download by visiting the release page and clicking the .exe file
```

## Release Page Checklist

- [ ] Release title is set: `ValueScale v1.2.2`
- [ ] Release notes are descriptive and readable
- [ ] Executable file is uploaded (`ValueScale_1.2.2.exe`)
- [ ] File size is reasonable (~120-150 MB typical)
- [ ] "Latest release" is marked (if applicable)
- [ ] Release is published (not a draft)

## Automated Release Script (Optional)

Create `.github/workflows/release.yml` for future automation:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run dist:portable
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/ValueScale_*.exe
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Troubleshooting

### Tag already exists
```bash
# Delete local tag
git tag -d v1.2.2

# Delete remote tag
git push origin --delete v1.2.2

# Create new tag
git tag -a v1.2.2 -m "Release version 1.2.2"
git push origin v1.2.2
```

### Need to edit release after publishing
1. Go to the release page
2. Click the pencil icon (Edit)
3. Make changes
4. Click "Update release"

### File upload failed
- Ensure file exists: `dist/ValueScale_1.2.2.exe`
- Try uploading again (GitHub has rate limits)
- Check file size is reasonable

### Wrong version in release
1. Delete the release (don't delete the tag)
2. Create a new release with correct version
3. Keep the same tag

## Release Announcement

After publishing, announce the release:

1. **GitHub Discussions** (if enabled)
   - Create a new discussion in the Announcements category

2. **Social Media** (optional)
   - Share on Twitter/X, Discord, Reddit, etc.
   - Include: Release link, key features, download link

3. **Changelog Maintainance**
   - Update [CHANGELOG.md](../CHANGELOG.md)
   - Move items from `[Unreleased]` to version section
   - Commit changes: `git commit -m "docs: update changelog for v1.2.2"`

## Future Releases

For next release, increment version in `package.json`:

```json
{
  "version": "1.2.3"
}
```

Then follow this same process.

## References

- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Git Tags Documentation](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
