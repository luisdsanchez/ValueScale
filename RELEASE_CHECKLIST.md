# Release Checklist for ValueScale v1.2.2

This checklist guides you through preparing ValueScale for a GitHub release.

## Pre-Release Steps

- [ ] **Update version number** (if needed)
  - Current version: `1.2.2` in `package.json`
  - Update if this is a new release

- [ ] **Review and update CHANGELOG.md**
  - Document all features, fixes, and changes since last release
  - Use the template provided in `CHANGELOG.md`

- [ ] **Test the application**
  - Run `npm start` and verify all features work
  - Test grayscale, posterize, brightness, contrast controls
  - Test window selection and capture area selection
  - Test value warnings and saturation gradient
  - Verify settings persist between launches
  - Test on Windows 10/11 (target platforms)

- [ ] **Build the portable executable**
  - Run `npm install` to ensure dependencies are up-to-date
  - Run `npm run dist:portable`
  - Verify `dist\ValueScale_1.2.2.exe` was created
  - Test the built executable on a clean machine if possible

- [ ] **Update documentation**
  - Verify README.md is current
  - Check that all feature descriptions match current implementation
  - Update any broken links or outdated information

## GitHub Release Steps

1. **Create a Git tag**
   ```bash
   git tag -a v1.2.2 -m "Release version 1.2.2"
   git push origin v1.2.2
   ```

2. **Create release on GitHub**
   - Go to: https://github.com/[username]/posterize-window/releases
   - Click "Draft a new release"
   - **Tag version:** `v1.2.2`
   - **Release title:** `ValueScale v1.2.2`
   - **Description:** Copy from `RELEASE_NOTES.md`
   - **Assets:** Upload `dist/ValueScale_1.2.2.exe`

3. **Mark as latest release**
   - Check "Set as the latest release" if applicable

4. **Publish the release**
   - Click "Publish release"

## Post-Release

- [ ] Verify the release is live at GitHub
- [ ] Test downloading the executable from the release
- [ ] Share release announcement (Discord, Twitter, etc.)
- [ ] Update any external documentation or websites

## Tips

- Keep release notes concise but informative
- Include user-facing features, not internal refactors
- Test the final executable before releasing
- Consider providing a changelog for transparency
