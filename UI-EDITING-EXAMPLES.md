# 🎨 UI Components - Editing Examples & Recipes

## Ready-to-Use Customization Examples

### 1. 🎨 Change Global Accent Color

**File to edit:** `ui/styles.css`

**Before:**
```css
:root {
  --accent: #FF6C38;    /* Orange */
}
```

**After (Blue):**
```css
:root {
  --accent: #3B82F6;    /* Blue */
}
```

**Result:** All buttons, highlights, and interactive elements turn blue!

---

### 2. 🌙 Create a Dark Theme Variant

**File to edit:** `ui/styles.css`

**Add at the end:**
```css
/* Dark mode variant */
html.dark-mode {
  --surface: #1a1a1a;
  --black: #0a0a0a;
  --white: #e0e0e0;
}
```

**To use it, add to HTML:**
```html
<html class="dark-mode">
```

---

### 3. 📏 Make Window Control Buttons Bigger

**File to edit:** `ui/window-controls.css`

**Before:**
```css
.window-controls button {
  width: 26px;
  height: 24px;
}
```

**After:**
```css
.window-controls button {
  width: 32px;      /* Increased from 26px */
  height: 30px;     /* Increased from 24px */
}
```

---

### 4. 🔘 Change Button Corner Radius (Rounded/Sharp)

**File to edit:** `ui/window-controls.css` (or any component CSS)

**For more rounded:**
```css
.window-controls button {
  border-radius: 8px;   /* Was 4px - more rounded */
}
```

**For sharp corners:**
```css
.window-controls button {
  border-radius: 0px;   /* Sharp corners */
}
```

---

### 5. ➕ Add a New Slider to Settings Panel

**File to edit:** `ui/panel-sliders.html`

**Add this new slider:**
```html
<!-- Saturation Slider -->
<div class="row">
  <div class="label">
    <span>Saturation</span>
    <span class="slider-value">
      <b id="vs">50</b>
      <button class="slider-reset" type="button" data-setting="saturation" aria-label="Reset saturation" title="Reset saturation">↻</button>
    </span>
  </div>
  <div class="slider">
    <input id="saturation" type="range" min="-100" max="100" step="1" aria-label="Saturation adjustment">
    <span class="slider-tick-track">
      <span class="slider-tick" style="--default-position: 50%"></span>
    </span>
  </div>
</div>
```

**Then add JavaScript in `panel-modular.html`:**
```javascript
// Add to the els object:
const els = {
  levels: document.getElementById('levels'),
  brightness: document.getElementById('brightness'),
  contrast: document.getElementById('contrast'),
  saturation: document.getElementById('saturation'),  // NEW
};

// Add output element:
const out = {
  levels: document.getElementById('vl'),
  brightness: document.getElementById('vb'),
  contrast: document.getElementById('vc'),
  saturation: document.getElementById('vs'),  // NEW
};
```

---

### 6. 🚫 Hide Quick Filter Buttons

**File to edit:** `ui/quick-filter-controls.css`

**Replace the entire .quick-filter-controls rule with:**
```css
.quick-filter-controls {
  display: none !important;  /* Completely hidden */
}
```

---

### 7. 🎯 Change Error Message Text Color

**File to edit:** `ui/error-message.css`

**Before:**
```css
#capture-error {
  color: var(--accent);
}
```

**After (Red):**
```css
#capture-error {
  color: #EF4444;  /* Red */
}
```

---

### 8. 📱 Adjust Panel Responsiveness

**File to edit:** `ui/quick-filter-controls.css`

**Change breakpoint (mobile adjustment):**
```css
/* Original: triggers at 270px */
@media (max-width: 270px) {
  .quick-filter-controls {
    top: 32px;
  }
}

/* Change to: triggers at 400px for wider mobile */
@media (max-width: 400px) {
  .quick-filter-controls {
    top: 32px;
  }
}
```

---

### 9. ✏️ Change Button Label Text

**File to edit:** `ui/quick-filter-controls.html`

**Before:**
```html
<button id="fewer-values" ... title="Fewer gray values">
```

**After:**
```html
<button id="fewer-values" ... title="Decrease shades">
```

---

### 10. 🎨 Add Hover Animation

**File to edit:** Any component CSS (e.g., `ui/window-controls.css`)

**Add to button rule:**
```css
.window-controls button {
  /* ... existing styles ... */
  transition: all 200ms ease;  /* Smooth animation */
  transform: scale(1);
}

.window-controls button:hover {
  transform: scale(1.1);  /* Grows on hover */
  /* ... other hover styles ... */
}
```

---

### 11. 🎭 Change Settings Panel Background

**File to edit:** `ui/panel-card.css`

**Before:**
```css
.card {
  background: var(--surface);  /* Uses --surface color */
  border: 1px solid rgba(255, 108, 56, 0.35);
}
```

**After (Custom background):**
```css
.card {
  background: linear-gradient(135deg, #2C2C2C 0%, #3A3A3A 100%);  /* Gradient */
  border: 2px solid var(--accent);  /* Thicker border */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);  /* Shadow effect */
}
```

---

### 12. 🔤 Change Font Family

**File to edit:** `ui/styles.css`

**Before:**
```css
html, body {
  font-family: -apple-system, "Segoe UI", sans-serif;
}
```

**After (Monospace - tech look):**
```css
html, body {
  font-family: "Courier New", monospace;
}
```

**After (Serif - elegant look):**
```css
html, body {
  font-family: "Georgia", serif;
}
```

---

### 13. 🔊 Increase Font Size

**File to edit:** `ui/styles.css`

**Add to body rule:**
```css
html, body {
  font-size: 14px;  /* Was 12px by default */
}
```

---

### 14. 🌈 Add Background Gradient

**File to edit:** `ui/window-selection-prompt.css`

**Modify the prompt background:**
```css
#window-selection-prompt {
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(255,108,56,0.1));
}
```

---

### 15. 🔐 Disable User Selection

**File to edit:** `ui/styles.css` or specific component

**Add to prevent text selection:**
```css
.window-controls,
.quick-filter-controls,
.card {
  user-select: none;  /* Prevents selecting text */
  -webkit-user-select: none;  /* For older Chrome */
}
```

---

### 16. ⚡ Add Focus Styles for Accessibility

**File to edit:** Any component CSS

**Example for buttons:**
```css
.window-controls button:focus {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(255, 108, 56, 0.2);
}
```

---

### 17. 🌟 Add a Glow Effect

**File to edit:** `ui/window-controls.css`

**On button hover:**
```css
.window-controls button:hover {
  background: var(--accent);
  color: var(--black);
  box-shadow: 0 0 10px var(--accent);  /* Glow effect */
}
```

---

### 18. 📍 Move Error Message Position

**File to edit:** `ui/error-message.css`

**Before (top-left):**
```css
#capture-error {
  top: 38px;
  left: 8px;
}
```

**After (top-right):**
```css
#capture-error {
  top: 38px;
  right: 8px;
  left: auto;
}
```

**After (bottom-center):**
```css
#capture-error {
  top: auto;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}
```

---

### 19. 🔲 Add Border to Sliders

**File to edit:** `ui/panel-card.css`

**Modify the slider rule:**
```css
.slider {
  position: relative;
  height: 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 2px;
}
```

---

### 20. 🎯 Disable a Button

**File to edit:** `ui/panel-toggles.html` or specific button HTML

**Add `disabled` attribute:**
```html
<!-- Before -->
<button id="my-button" type="button">Click me</button>

<!-- After -->
<button id="my-button" type="button" disabled>Click me</button>
```

---

### 21. 🎨 Add Icon to Button

**File to edit:** `ui/window-controls.html` or any button HTML

**Example adding an icon:**
```html
<button id="my-button" type="button">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <!-- SVG content here -->
  </svg>
  Label
</button>
```

---

### 22. 🔄 Change Slider Range

**File to edit:** `ui/panel-sliders.html`

**Before (0-8 range):**
```html
<input id="levels" type="range" min="0" max="8" step="1">
```

**After (wider range, finer control):**
```html
<input id="levels" type="range" min="0" max="20" step="1">
```

---

### 23. 🎭 Toggle Dark/Light Theme Button

**Files to edit:** `ui/window-controls.html` and `ui/window-controls.css`

**Add button to HTML:**
```html
<button id="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle theme">
  <svg><!-- theme icon --></svg>
</button>
```

**Add CSS:**
```css
.window-controls button.dark-mode {
  background: var(--accent);
  color: var(--black);
}
```

**Add JavaScript:**
```javascript
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.documentElement.classList.toggle('dark-mode');
});
```

---

### 24. 📏 Adjust Panel Width

**File to edit:** `main.js` (Electron)

**Find and change:**
```javascript
const PANEL_WIDTH = 320;      // Was 320
// Change to:
const PANEL_WIDTH = 400;      // Now 400px wider
```

---

### 25. 🎯 Add Tooltip on Hover

**File to edit:** Any HTML component file

**HTML:**
```html
<button type="button" title="Custom tooltip text">Button</button>
```

**CSS to style tooltip:**
```css
button[title] {
  position: relative;
}

button[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}
```

---

## Recipe Summary

| Goal | File | Property to Change |
|------|------|--------------------|
| Change colors | `styles.css` | `--accent`, `--surface`, etc |
| Modify buttons | Component CSS | `width`, `height`, `border-radius` |
| Hide elements | Component CSS | `display: none` |
| Add animations | Component CSS | `transition`, `transform` |
| Adjust text | Component CSS | `font-size`, `font-family`, `color` |
| Change layout | Component CSS | `position`, `top`, `left`, `z-index` |
| Update HTML | Component HTML | Add/remove/modify elements |
| Adjust sizing | Component CSS | Update pixel values |
| Add effects | Component CSS | `box-shadow`, `filter`, etc |
| Responsive | Component CSS | Media queries |

---

## Pro Tips

1. **Always start with theme colors** - Modify `ui/styles.css` first
2. **Use CSS variables** - Reference `--accent`, `--white` instead of hardcoding colors
3. **Test in DevTools** - Use Inspect Element to test CSS changes
4. **Keep backups** - Commit changes before major modifications
5. **Comment your changes** - Add `/* Comment */` to explain modifications
6. **Use transition** - Add `transition` to make changes smooth
7. **Mobile first** - Consider responsive behavior when editing

---

**These examples should cover 95% of common customizations! Mix and match as needed.** 🎨
