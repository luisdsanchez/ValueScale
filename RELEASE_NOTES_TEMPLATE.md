# Release Notes Template

Use this template as a starting point when creating release notes for new versions.

## Template for Copy-Paste

```markdown
# Release Notes - ValueScale v[VERSION]

## Overview
[1-2 sentence summary of what this release includes. E.g., "ValueScale v1.2.3 brings performance improvements and fixes critical bugs in window selection. This release also adds support for high-DPI displays."]

## ✨ Features

### [Category 1 - e.g., "Display & Rendering"]
- Feature description with benefit
- Another feature with technical detail
- Major improvement with context

### [Category 2 - e.g., "Controls & Settings"]
- UI improvement
- New control or setting
- Enhanced workflow feature

### [Category 3 - Other Features as needed]
- New capability
- Extended functionality

## 🐛 Bug Fixes

- Fixed [specific issue] that caused [symptom]
- Resolved [problem] when [condition occurs]
- Corrected [behavior] to work properly with [context]

## 🔧 Improvements & Optimizations

- Improved [specific area] for better [outcome]
- Enhanced [feature] performance by [X%] or [method]
- Better [behavior] in [scenario]
- Refined [UI element] for clarity

## 🔄 Breaking Changes

[Only if applicable - list changes that break backward compatibility]

- Changed [X] from [old behavior] to [new behavior]
- Removed deprecated [feature]
- Renamed [setting] to [new name]

## ⚠️ Known Issues

[Only if applicable - known bugs that exist in this release]

- Issue: [description]
  - Workaround: [if any]
  - Expected fix: [future version if known]

## 📋 System Requirements

- **OS:** Windows 10 or Windows 11, x64 architecture
- **RAM:** Minimal (~50MB typical usage)
- **GPU:** Recommended for smooth real-time capture
- **Additional:** [Any new requirements, if any]

## ⌨️ Controls

[Update if new controls were added]

| Action | Control |
|--------|---------|
| Move window | Left-drag the projection |
| Resize | Drag window edges |
| Show/hide settings | Hover over projection |
| [New action if added] | [How to do it] |

## 📝 Notes

- Note 1: Specific behavior or consideration
- Note 2: Platform-specific information if relevant
- Note 3: Performance considerations or tips

## 🔗 Resources

- **GitHub Repository:** [link to repository]
- **Issue Tracker:** [link to issues]
- **Previous Releases:** [link to releases page]
- **Author:** LuisDiegoArt

---

**Have questions or found a bug?** Please [open an issue](link/to/issues) on GitHub.
```

## Customization Guide

### Before Publishing

1. **Replace [VERSION]** with actual version number (e.g., 1.2.3)

2. **Write Overview** (1-2 sentences)
   - Summarize major changes
   - Highlight what's new or fixed
   - Examples:
     - "v1.2.3 improves performance and fixes critical bugs"
     - "v2.0.0 is a major rewrite with new features and better stability"
     - "v1.2.2 adds value warnings and saturation gradient visualization"

3. **List Features** in categories
   - Group related features together
   - Explain the benefit, not just the feature
   - Use bullet points for each item
   - Examples:
     ```
     - New saturation gradient visualization to analyze color in grayscale mode
     - Customizable warning thresholds for precise control over dark/light detection
     - Improved window selection dialog with better application icons
     ```

4. **Document Bug Fixes**
   - Include which bug was fixed
   - Mention the symptom/impact
   - Examples:
     ```
     - Fixed settings not persisting when application crashes
     - Resolved incorrect brightness calculations with posterization
     - Corrected window selection on multi-monitor setups
     ```

5. **Add Improvements**
   - Performance enhancements
   - UI/UX refinements
   - Better error messages
   - Examples:
     ```
     - Improved window refresh response time by 40%
     - Enhanced error messages for capture failures
     - Better visual feedback for slider controls
     ```

6. **Include Only If Applicable:**
   - Breaking Changes (if any)
   - Known Issues (if any)
   - Migration Guide (if breaking changes exist)

## Writing Tips

### Keep It Readable
- Use short, clear sentences
- Avoid technical jargon (or explain it)
- Format with headers and bullet points
- One idea per bullet point

### Be Specific
✅ GOOD: "Fixed crash when switching between high and low contrast images"
❌ BAD: "Fixed some issues"

✅ GOOD: "Improved window selection performance by 40%"
❌ BAD: "Made it faster"

### Focus on Users
✅ GOOD: "Artists can now adjust saturation warnings independently"
❌ BAD: "Refactored warning system architecture"

### Use Emoji for Categories
- ✨ Features (new capabilities)
- 🐛 Bug Fixes (things that now work)
- 🔧 Improvements (better performance/UX)
- 🔄 Breaking Changes (things that changed)
- ⚠️ Known Issues (things that don't work yet)
- ⌨️ Controls (how to use the app)
- 📋 System Requirements (what you need)
- 🚀 Getting Started (how to begin)
- 🙏 Credits (who to thank)

## Examples from ValueScale v1.2.2

### Feature Description Example
```
### Value Warnings
- Mark dark areas in blue and light areas in orange with customizable thresholds
- Independently toggle warnings on/off without affecting other settings
- Faint color wash with stronger stripes for subtle yet visible warnings
- Thresholds default to 2% and 97% (pure black to `#FDFDFD`)
```

### Bug Fix Example
```
- Fixed settings panel not appearing on first launch with certain window managers
- Resolved slider tick positions displaying incorrectly on some resolutions
- Corrected grayscale calculation to work properly with custom brightness values
```

### Improvement Example
```
- Improved window refresh reliability by batching display updates
- Enhanced error messages to include actionable guidance
- Optimized memory usage for large capture areas
```

## Version Naming Conventions

**Semantic Versioning: X.Y.Z**

- **Major (X):** Breaking changes, complete rewrites, significant new features
  - Example: v1.0.0 → v2.0.0
  - Requires breaking changes section

- **Minor (Y):** New features, non-breaking improvements
  - Example: v1.2.2 → v1.3.0
  - Highlights: New Features section

- **Patch (Z):** Bug fixes, minor improvements
  - Example: v1.2.2 → v1.2.3
  - Highlights: Bug Fixes section

## Publishing Checklist

Before copying release notes to GitHub:

- [ ] All sections are filled in (delete unused sections)
- [ ] Version number matches package.json and git tag
- [ ] No placeholder text remains (search for `[` and `]`)
- [ ] Links are correct and working
- [ ] Formatting is clean and readable
- [ ] Grammar and spelling checked
- [ ] No sensitive information included
- [ ] Emoji are consistent with this guide

## Quick Format Check

Before publishing, ensure the release notes:
1. ✅ Start with version number and date
2. ✅ Have clear overview paragraph
3. ✅ Use consistent emoji and formatting
4. ✅ Include features, fixes, and improvements
5. ✅ Have system requirements section
6. ✅ End with resources and author credit

---

**Last Updated:** 2026-11-25  
**For:** ValueScale Release Notes
