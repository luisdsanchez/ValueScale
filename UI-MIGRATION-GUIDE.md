# UI Components - Migration & Usage Guide

## 📁 Folder Structure

```
posterize-window/
├── ui/                              # NEW: UI Components folder
│   ├── README.md                   # Component documentation
│   ├── styles.css                  # Shared theme and common styles
│   ├── window-controls.css         # Window control buttons styles
│   ├── window-controls.html        # Window control buttons HTML
│   ├── quick-filter-controls.css   # Quick filter buttons styles
│   ├── quick-filter-controls.html  # Quick filter buttons HTML
│   ├── error-message.css           # Error display styles
│   ├── error-message.html          # Error display HTML
│   ├── window-selection-prompt.css # Window selection dialog styles
│   ├── window-selection-prompt.html# Window selection dialog HTML
│   ├── panel-card.css              # Settings panel styles
│   ├── panel-window-options.html   # Window options section
│   ├── panel-sliders.html          # Slider controls section
│   ├── panel-toggles.html          # Toggle switches section
│   ├── panel-footer.html           # Footer section
│   ├── crop-selection.css          # Crop selection styles
│   └── crop-selection.html         # Crop selection HTML
│
├── index.html                       # Original main window (unchanged)
├── index-modular.html              # NEW: Modular version using UI components
├── panel.html                       # Original settings panel (unchanged)
├── panel-modular.html              # NEW: Modular version using UI components
├── crop-selection.html             # Original crop selection (unchanged)
├── crop-selection-modular.html     # NEW: Modular version using UI components
│
├── main.js                         # Electron main process
├── preload.js                      # Preload script
└── ...other files...
```

## 🚀 Getting Started

### Option 1: Use Modular Versions Directly

If you want to use the new modular structure immediately:

1. Update your `main.js` to point to the modular HTML files:
```javascript
// In main.js, change the BrowserWindow paths:
mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
  },
});
mainWindow.loadFile('index-modular.html');  // Changed from index.html

// For panel window:
panelWindow.loadFile('panel-modular.html');  // Changed from panel.html

// For crop selection:
cropWindow.loadFile('crop-selection-modular.html');  // Changed from crop-selection.html
```

2. Test that everything works as expected.

### Option 2: Gradual Migration

Keep using the original files and gradually migrate components:

1. The original `index.html`, `panel.html`, and `crop-selection.html` remain unchanged
2. Create new modular versions when you're ready
3. Test thoroughly before switching `main.js` to use them

## 🎨 Customization Guide

### Changing Colors Globally

Edit `ui/styles.css`:
```css
:root {
  --surface: #2C2C2C;      /* Background color */
  --accent: #FF6C38;       /* Accent/highlight color */
  --white: #f5f5f5;        /* Light text */
  --black: #1a1a1a;        /* Dark background */
}
```

### Customizing Individual Components

Each component has its own CSS file for easy customization:

- **Window Controls Size**: Edit `ui/window-controls.css`
  ```css
  .window-controls button {
    width: 26px;    /* Change this */
    height: 24px;   /* And this */
  }
  ```

- **Button Colors**: Edit component's CSS file
  ```css
  button:hover {
    background: var(--accent);  /* Uses global color */
  }
  ```

- **Panel Width**: Edit `ui/panel-card.css`
  ```css
  .card {
    width: 320px;  /* Adjust card width */
  }
  ```

### Adding New Buttons

1. Create a new CSS file: `ui/my-new-component.css`
2. Create the HTML file: `ui/my-new-component.html`
3. Link the CSS in your HTML file: `<link rel="stylesheet" href="ui/my-new-component.css">`
4. Add the HTML where needed

Example component structure:
```html
<!-- ui/my-component.html -->
<div class="my-component">
  <button id="my-button" type="button">My Button</button>
</div>
```

```css
/* ui/my-component.css */
.my-component {
  position: fixed;
  /* ... styles ... */
}

.my-component button {
  /* ... button styles ... */
}
```

## 📋 Component Reference

### Main Window (index.html / index-modular.html)
| Component | File | Location |
|-----------|------|----------|
| Quick Filter Controls | quick-filter-controls.* | Top-left |
| Window Controls | window-controls.* | Top-right |
| Error Message | error-message.* | Top-left below filters |
| Window Selection | window-selection-prompt.* | Center (overlay) |

### Settings Panel (panel.html / panel-modular.html)
| Component | File | Location |
|-----------|------|----------|
| Window Options | panel-window-options.html | Top section |
| Sliders | panel-sliders.html | Middle section |
| Toggles | panel-toggles.html | Bottom section |
| Footer | panel-footer.html | Very bottom |

### Crop Selection (crop-selection.html / crop-selection-modular.html)
| Component | File | Location |
|-----------|------|----------|
| Video/Canvas | crop-selection.* | Full window |
| Error Display | crop-selection.html | Bottom center |

## ✏️ Editing Individual Elements

### Quick Filters - Change Button Labels

Edit `ui/quick-filter-controls.html`:
```html
<button id="posterize-toggle" ... title="Toggle posterize">
  <!-- Change title attribute -->
</button>
```

### Sliders - Add a New Slider

Add to `ui/panel-sliders.html`:
```html
<div class="row">
  <div class="label">
    <span>New Setting</span>
    <span class="slider-value">
      <b id="new-value">0</b>
      <button class="slider-reset" type="button" data-setting="newSetting">↻</button>
    </span>
  </div>
  <div class="slider">
    <input id="new-setting" type="range" min="0" max="100" step="1">
    <span class="slider-tick-track">
      <span class="slider-tick" style="--default-position: 50%"></span>
    </span>
  </div>
</div>
```

### Window Controls - Customize Icons

Edit `ui/window-controls.html` and modify the SVG elements inside buttons.

## 🔄 Switching Between Original and Modular Versions

### In main.js:

**To use original files:**
```javascript
mainWindow.loadFile('index.html');
panelWindow.loadFile('panel.html');
cropWindow.loadFile('crop-selection.html');
```

**To use modular files:**
```javascript
mainWindow.loadFile('index-modular.html');
panelWindow.loadFile('panel-modular.html');
cropWindow.loadFile('crop-selection-modular.html');
```

## 🧪 Testing

1. **Visual Test**: Open the app and verify all UI elements appear correctly
2. **Interaction Test**: Test all buttons and controls work as expected
3. **Responsive Test**: Resize windows and check responsive behavior
4. **CSS Verification**: Check browser DevTools to ensure correct styles are applied

## 📝 Adding Documentation

Each component HTML file can include comments for clarity:

```html
<!-- Component description and purpose -->
<!-- Author: Your Name -->
<!-- Last Updated: YYYY-MM-DD -->
<div class="component-name">
  <!-- Element description -->
  <button>...</button>
</div>
```

## 🎯 Best Practices

1. **Keep CSS and HTML Together**: Each component has matching CSS and HTML files
2. **Use CSS Variables**: Reference `--accent`, `--white`, etc., from `styles.css`
3. **Don't Break IDs**: HTML element IDs are referenced by JavaScript, so keep them consistent
4. **Test After Changes**: Always test components after CSS modifications
5. **Comment Your Changes**: Add comments explaining any customizations

## 🐛 Troubleshooting

### Styles Not Applying
- Check that CSS file is properly linked in HTML
- Verify CSS selector matches the HTML element
- Clear browser cache and reload

### Component Not Showing
- Check if component has `hidden` attribute (remove it)
- Verify element has proper `display` CSS property
- Check z-index conflicts with other elements

### JavaScript Errors
- Verify element IDs in HTML match JavaScript selectors
- Check DevTools console for specific error messages
- Ensure window.api is available (Electron preload script)

## 📞 Support

For issues or questions about the modular UI structure:
1. Check the README.md in the `ui/` folder
2. Review this guide
3. Check individual component CSS/HTML files for specific details

---

**Version**: 1.0
**Last Updated**: 2026-11-25
**Compatible With**: ValueScale Electron App
