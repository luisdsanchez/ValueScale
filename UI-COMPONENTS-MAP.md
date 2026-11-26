# 🎯 UI Components - Visual Connection Map

## Component Ecosystem Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON APP (main.js)                   │
└──────────────────┬────────────────────────────────────────┬─┘
                   │                                        │
                   ▼                                        ▼
        ┌──────────────────────┐              ┌──────────────────┐
        │  MAIN WINDOW         │              │  SETTINGS PANEL  │
        │ (index-modular.html) │              │(panel-modular.html)
        └──────────┬───────────┘              └────────┬─────────┘
                   │                                   │
        ┌──────────┴───────────────┬────────────┐      │
        │                          │            │      │
        ▼                          ▼            ▼      ▼
   ┌─────────────┐    ┌────────────────┐    ┌─────────────┐
   │Quick Filters│    │Window Controls │    │Panel Styles │
   │  (LEFT TOP) │    │  (RIGHT TOP)   │    │   (WHOLE)   │
   └─────────────┘    └────────────────┘    └─────────────┘
        │                     │                     │
        ├─► quick-filter-controls.css    ├─► panel-card.css
        │   quick-filter-controls.html   │
        │                                 ├─► panel-window-options.html
        └─► styles.css (theme)           │
                                         ├─► panel-sliders.html
                                         │
                                         ├─► panel-toggles.html
                                         │
                                         └─► panel-footer.html
```

## File Dependencies & Usage

### Theme Foundation
```
styles.css (Global)
  ├─► Defines: --accent, --surface, --white, --black
  ├─► Used by: ALL component CSS files
  └─► Location: ui/styles.css
```

### Main Window (index-modular.html)
```
index-modular.html
  │
  ├─► <link> ui/styles.css (theme)
  ├─► <link> ui/window-controls.css
  ├─► <link> ui/quick-filter-controls.css
  ├─► <link> ui/error-message.css
  ├─► <link> ui/window-selection-prompt.css
  │
  └─► HTML Elements:
      ├─► <canvas id="c"></canvas>
      │
      ├─► <div id="capture-error"></div>
      │   └─ Uses: error-message.css
      │
      ├─► <div id="window-selection-prompt"></div>
      │   └─ Uses: window-selection-prompt.css
      │
      ├─► <div class="quick-filter-controls"></div>
      │   ├─ id: posterize-toggle
      │   ├─ id: fewer-values
      │   ├─ id: value-count
      │   └─ id: more-values
      │   └─ Uses: quick-filter-controls.css
      │
      └─► <div class="window-controls"></div>
          ├─ id: open-settings
          ├─ id: minimize
          ├─ id: maximize
          └─ id: close
          └─ Uses: window-controls.css
```

### Settings Panel (panel-modular.html)
```
panel-modular.html
  │
  ├─► <link> ui/styles.css (theme)
  ├─► <link> ui/panel-card.css
  │
  └─► <div class="card">
      │
      ├─► panel-window-options.html
      │   ├─ id: window-options (expandable)
      │   ├─ id: window-list
      │   ├─ id: refresh-windows
      │   ├─ id: select-area
      │   └─ id: reset-area
      │
      ├─► panel-sliders.html
      │   ├─ id: levels (gray values slider)
      │   ├─ id: brightness (brightness slider)
      │   └─ id: contrast (contrast slider)
      │
      ├─► panel-toggles.html
      │   ├─ id: posterize (checkbox)
      │   └─ id: quick-filter-buttons (checkbox)
      │
      └─► panel-footer.html
          ├─ id: app-version
          └─ Credit text
```

### Crop Selection (crop-selection-modular.html)
```
crop-selection-modular.html
  │
  ├─► <link> ui/styles.css (theme)
  ├─► <link> ui/crop-selection.css
  │
  └─► HTML Elements:
      ├─► <video id="source"></video>
      ├─► <canvas id="overlay"></canvas>
      └─► <div id="error"></div>
```

## Style Inheritance Chain

```
1. styles.css (Base)
   └─ Defines global variables & common styles
   
2. Component-specific CSS files
   ├─ window-controls.css
   ├─ quick-filter-controls.css
   ├─ error-message.css
   ├─ window-selection-prompt.css
   ├─ panel-card.css
   └─ crop-selection.css
   
3. Component HTML
   └─ Uses class names defined in component CSS
```

## JavaScript Event Flow

```
HTML Elements (IDs)
       ↓
  JavaScript
       ↓
  Event Listeners
       ↓
  Window API (preload.js)
       ↓
  Main Process (main.js)
       ↓
  Application Logic

Example: Posterize Toggle Button
─────────────────────────────────
1. HTML: <button id="posterize-toggle"> ... </button>
2. CSS:  .window-controls button { ... }
3. JS:   document.getElementById('posterize-toggle')
         .addEventListener('click', () => {...})
4. API:  window.api.adjustFilter('posterize')
5. Main: Receives IPC message, updates settings
```

## Color Flow

```
ui/styles.css (Root Variables)
        │
        ├─ --accent: #FF6C38
        ├─ --surface: #2C2C2C
        ├─ --white: #f5f5f5
        └─ --black: #1a1a1a
        │
        ▼
Used by all component CSS files
        │
        ├─ var(--accent) on button hover
        ├─ var(--surface) for backgrounds
        ├─ var(--white) for text
        └─ var(--black) for borders
```

## File Edit Workflow

```
Want to change...                Then edit file...
─────────────────────────────────────────────────────
Button colors globally          → ui/styles.css (:root)
Window control buttons          → ui/window-controls.css
Quick filter buttons            → ui/quick-filter-controls.css
Error message style             → ui/error-message.css
Window selection dialog         → ui/window-selection-prompt.css
Settings panel layout           → ui/panel-card.css
Window options section          → ui/panel-window-options.html
Slider controls                 → ui/panel-sliders.html
Toggle switches                 → ui/panel-toggles.html
Crop selection overlay          → ui/crop-selection.css
```

## Component Reusability Map

```
Quick Filter Controls
├─ Used in: index-modular.html
└─ Reusable: Yes (can be added to other windows)

Window Controls
├─ Used in: index-modular.html
└─ Reusable: Yes (can be added to crop-selection, etc)

Error Message
├─ Used in: index-modular.html, crop-selection-modular.html
└─ Reusable: Yes (globally applicable)

Panel Components
├─ Used in: panel-modular.html
├─ panel-window-options: Reusable
├─ panel-sliders: Reusable
├─ panel-toggles: Reusable
└─ panel-footer: Reusable
```

## Development Workflow

```
Step 1: Modify Component
├─ Edit CSS file (styling)
└─ Edit HTML file (structure)

Step 2: Test Component
├─ Open DevTools (F12)
├─ Check Network tab (CSS loads)
├─ Inspect element (verify styles)
└─ Test interactions

Step 3: Verify All Components
├─ Check main window
├─ Check settings panel
├─ Check crop selection
└─ Check responsive behavior

Step 4: Commit Changes
└─ All component files are in ui/ folder
```

## Troubleshooting Decision Tree

```
Issue: Styles not applying
├─ Check 1: CSS file linked in HTML?
├─ Check 2: Element ID/class matches CSS selector?
├─ Check 3: Browser cache cleared?
└─ Check 4: DevTools shows file loaded (200 status)?

Issue: Component not visible
├─ Check 1: Element has [hidden] attribute?
├─ Check 2: Display property set correctly?
├─ Check 3: z-index conflicts?
└─ Check 4: Opacity set to 0?

Issue: Buttons not responding
├─ Check 1: JavaScript can find element (ID matches)?
├─ Check 2: Event listener attached?
├─ Check 3: window.api available (Electron)?
└─ Check 4: Console has errors?
```

## Quick Navigation

For quick help, go to:

1. **Setting up modular version?**
   → Read: UI-MIGRATION-GUIDE.md

2. **Need to find a specific element?**
   → Check: UI-QUICK-REFERENCE.md

3. **Want component details?**
   → Read: ui/README.md

4. **Just getting started?**
   → Read: UI-SETUP-SUMMARY.md (this file first!)

5. **Understanding structure?**
   → You're reading: This file!

## Component Statistics

```
Total Files: 20+
├─ CSS Files: 8
├─ HTML Component Files: 9
├─ HTML Application Files: 3 (modular versions)
└─ Documentation Files: 4

Lines of Code (approximate)
├─ CSS: ~2,500 lines
├─ HTML: ~4,000 lines
└─ Documentation: ~3,000 lines

Total Coverage
├─ Main Window: 100%
├─ Settings Panel: 100%
└─ Crop Selection: 100%
```

## Next Actions

After understanding this map:

1. ✅ Read UI-SETUP-SUMMARY.md
2. ✅ Read UI-MIGRATION-GUIDE.md
3. ✅ Check UI-QUICK-REFERENCE.md for specific edits
4. ✅ Update main.js to use modular versions
5. ✅ Test the application
6. ✅ Customize as needed using component files

---

**This map shows how all components connect and flow together. Use it as a reference when understanding the system!**
