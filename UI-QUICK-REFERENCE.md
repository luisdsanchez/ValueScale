# UI Components - Quick Reference Card

## 🎨 Color Theme Variables

```css
--surface: #2C2C2C       /* Card backgrounds, panel bg */
--accent: #FF6C38        /* Buttons, highlights, hover states */
--white: #f5f5f5         /* Text, icons */
--black: #1a1a1a         /* Dark backgrounds, borders */
```

## 📂 Component Files Quick Lookup

| Need to... | File to Edit |
|-----------|--------------|
| Change button colors | `styles.css` or component CSS |
| Modify window control buttons | `window-controls.css` / `.html` |
| Edit quick filter buttons | `quick-filter-controls.css` / `.html` |
| Change error message style | `error-message.css` / `.html` |
| Modify window selection dialog | `window-selection-prompt.css` / `.html` |
| Edit panel/settings layout | `panel-card.css` |
| Customize sliders | `panel-sliders.html` / `panel-card.css` |
| Edit toggles | `panel-toggles.html` |
| Modify crop selection UI | `crop-selection.css` / `.html` |

## 🔑 Important Element IDs

### Main Window (index.html)
- `c` - WebGL canvas
- `capture-error` - Error message container
- `window-selection-prompt` - Window selection dialog
- `posterize-toggle` - Posterize button
- `fewer-values` - Fewer gray values button
- `value-count` - Gray value counter display
- `more-values` - More gray values button
- `open-settings` - Settings button
- `minimize` - Minimize button
- `maximize` - Maximize/restore button
- `close` - Close button
- `select-window` - Window selection button

### Settings Panel (panel.html)
- `window-options` - Window options section (expandable)
- `window-list` - Window selection dropdown
- `refresh-windows` - Refresh windows button
- `select-area` - Select capture area button
- `reset-area` - Reset capture area button
- `levels` - Gray values slider
- `brightness` - Brightness slider
- `contrast` - Contrast slider
- `posterize` - Posterize checkbox
- `quick-filter-buttons` - Quick filter buttons checkbox
- `vl`, `vb`, `vc` - Value displays for sliders

### Crop Selection (crop-selection.html)
- `source` - Video element for preview
- `overlay` - Canvas for drawing selection overlay
- `error` - Error message display

## 🎯 CSS Class Reference

### Button Styles
```css
.window-controls button    /* Window control buttons */
.quick-filter-controls button  /* Quick filter buttons */
.slider-reset             /* Reset buttons on sliders */
.actions button           /* Action buttons */
```

### Layout Classes
```css
.card                     /* Panel card container */
.row                      /* Setting row container */
.slider                   /* Slider wrapper */
.toggle                   /* Toggle/checkbox wrapper */
.window-options           /* Window options section */
```

### Status Classes
```css
.error                    /* Error text styling */
.note                     /* Note text styling */
.foot                     /* Footer styling */
```

## 🔗 Linking CSS in HTML

```html
<!-- Always include shared styles first -->
<link rel="stylesheet" href="ui/styles.css">

<!-- Then include component-specific styles -->
<link rel="stylesheet" href="ui/component-name.css">
```

## 📐 Common Sizes

| Element | Size |
|---------|------|
| Window control buttons | 26px × 24px |
| Quick filter buttons | 26px × 24px |
| Reset button | 16px × 16px |
| Slider height | 18px |
| Panel width | 320px (fixed in main.js) |
| Panel collapsed height | 310px |
| Panel expanded height | 550px |

## 🚀 Quick Start: Switching to Modular Version

1. **In `main.js`, replace:**
   ```javascript
   // OLD:
   mainWindow.loadFile('index.html');
   panelWindow.loadFile('panel.html');
   
   // NEW:
   mainWindow.loadFile('index-modular.html');
   panelWindow.loadFile('panel-modular.html');
   ```

2. **Verify all files exist in `ui/` folder:**
   - styles.css ✓
   - window-controls.css/html ✓
   - quick-filter-controls.css/html ✓
   - error-message.css/html ✓
   - window-selection-prompt.css/html ✓
   - panel-card.css ✓
   - panel-*.html (3 files) ✓
   - crop-selection.css/html ✓

3. **Test the application**

## 🎬 CSS Media Queries

```css
/* Mobile adjustments */
@media (max-width: 270px) {
  /* Quick filter controls and buttons resize */
  .quick-filter-controls { gap: 2px; }
  .value-count { width: 24px; }
}

@media (max-width: 155px) {
  /* Window controls resize */
  .window-controls { gap: 2px; }
  .window-controls button { width: 18px; }
}
```

## 🎨 Customization Examples

### Change Accent Color Globally
```css
/* In styles.css */
:root {
  --accent: #00FF00;  /* Change to your color */
}
```

### Make Buttons Bigger
```css
/* In component-specific CSS */
button {
  width: 32px;    /* Was 26px */
  height: 28px;   /* Was 24px */
}
```

### Add Rounded Corners
```css
.card {
  border-radius: 15px;  /* Was 10px */
}
```

### Change Font
```css
/* In styles.css */
html, body {
  font-family: "Your Font", sans-serif;
}
```

## 📱 Responsive Behavior

- **Quick filter controls**: Auto-hide on small screens, adjust gap/size
- **Window controls**: Resize for screens < 155px wide
- **Error message**: Adjust position on screens < 270px wide
- **Canvas**: Full viewport, responsive to window resizing

## 🔍 Debugging Tips

1. **Check element visibility:**
   ```javascript
   console.log(document.getElementById('element-id').hidden);
   ```

2. **Verify styles applied:**
   - Open DevTools (F12)
   - Right-click element → Inspect
   - Check Styles panel for applied CSS

3. **Check element position:**
   - Look for `position: fixed` or `position: absolute`
   - Check `z-index` for layering issues
   - Check `opacity` and `pointer-events`

4. **Verify CSS is loaded:**
   - Open Network tab in DevTools
   - Check status code for CSS files (should be 200)

## 🎯 File Organization Strategy

```
ui/
├── Shared/Foundation
│   └── styles.css (theme + common)
│
├── Main Window Components
│   ├── window-controls.css/html
│   ├── quick-filter-controls.css/html
│   ├── error-message.css/html
│   └── window-selection-prompt.css/html
│
├── Panel Components
│   ├── panel-card.css (all panel styling)
│   ├── panel-window-options.html
│   ├── panel-sliders.html
│   ├── panel-toggles.html
│   └── panel-footer.html
│
└── Crop Selection Components
    ├── crop-selection.css
    └── crop-selection.html
```

## ✅ Verification Checklist

- [ ] All UI files copied to `ui/` folder
- [ ] HTML files link to correct CSS files
- [ ] Element IDs match between HTML and JavaScript
- [ ] Color variables defined in `styles.css`
- [ ] Responsive media queries tested
- [ ] All buttons functional
- [ ] All sliders working
- [ ] All toggles working
- [ ] Error messages display correctly
- [ ] Window controls respond to clicks
- [ ] No console errors

---

**Keep this file for quick reference when editing UI components!**
