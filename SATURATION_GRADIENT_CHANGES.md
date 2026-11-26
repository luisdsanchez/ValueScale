# Saturation Gradient Map Changes

## Overview
Modified the saturation warning visualization system to display a **colored gradient map** instead of magenta striped overlays. The new system maps artwork colors based on their saturation levels using a smooth gradient.

## Changes Made

### File: `index.html`

#### Fragment Shader (FS) Modifications

**New Helper Function: `saturationGradient(float saturation)`**
- Maps saturation values (0.0 to 1.0) to a color gradient
- **Low Saturation (Dull colors, 0.0-0.33)**: Blue gradient
  - Ranges from dark blue `(0.2, 0.4, 1.0)` to light blue `(0.3, 0.7, 1.0)`
  - Visualizes muted, desaturated colors
  
- **Mid Saturation (Moderate colors, 0.33-0.67)**: Cyan to Yellow gradient
  - Smooth transition from cyan `(0.3, 0.7, 1.0)` to yellow `(1.0, 1.0, 0.3)`
  - Shows colors gaining vibrancy
  
- **High Saturation (Vivid colors, 0.67-1.0)**: Yellow to Red gradient
  - Transitions from yellow `(1.0, 1.0, 0.3)` to red `(1.0, 0.3, 0.3)`
  - Highlights highly saturated, vibrant colors

#### Modified Saturation Warning Logic

**Before:**
```glsl
if (saturationWarnings > 0.5 && highest > saturationBrightnessThreshold && saturation >= saturationThreshold) {
  outputColor = warningOverlay(outputColor, vec3(0.9, 0.2, 0.9), 0.0, 0.6);
}
```

**After:**
```glsl
if (saturationWarnings > 0.5 && highest > saturationBrightnessThreshold / 100.0) {
  vec3 gradientColor = saturationGradient(saturation);
  outputColor = mix(outputColor, gradientColor, 0.6);
}
```

**Key Differences:**
1. **`saturationThreshold` is no longer used** - all saturation levels (not just those above threshold) are now visualized with color gradients
   - The UI control for "Saturation threshold" still exists in the settings panel for backward compatibility, but has no effect on the gradient map
   - To filter based on saturation, modify the `saturationGradient()` function to return a neutral color below your desired threshold
2. **Removes the striped overlay effect** - replaced with smooth color blending
3. **Fixed brightness threshold calculation** - normalized to 0-1 range by dividing by 100 (matches HSV brightness 0-100 scale)
4. **Uses `mix()` for smooth blending** - 60% blend of gradient color with original artwork, preserving some visual context

## Visual Effect

### Before
- Magenta stripes overlaid on dimmed image
- Only shows areas that exceed saturation threshold
- Creates high-contrast warning appearance
- Harder to see saturation variation

### After
- Continuous color gradient mapping across entire image
- Dull areas appear blue
- Moderate saturation areas appear cyan-to-yellow
- Vivid areas appear red
- 60% blend preserves underlying artwork while showing saturation levels
- Creates heatmap-like visualization of saturation distribution

## Behavior

**Activation:**
- Saturation warnings must be enabled (toggle "S!" in quick controls or settings)
- Applies when `saturationWarnings > 0.5` and color brightness exceeds `saturationBrightnessThreshold`

**Independence:**
- Saturation gradient mapping is now independent of the threshold value
- Shows saturation levels for all colors meeting the brightness minimum
- Can be used together with value warnings (blue/orange zones) without conflict

## Technical Details

- **Gradient Mapping**: 3-segment smooth interpolation based on saturation value
- **Blending Mode**: 60% opacity blend (`mix(outputColor, gradientColor, 0.6)`) with original color
- **Performance**: Added one helper function call per pixel when saturation warnings are enabled
- **WebGL Compatibility**: Uses standard WebGL 1.0 features, no additional extensions needed

## Customization

To modify the gradient colors, edit the `saturationGradient()` function in `index.html`:

```glsl
vec3 saturationGradient(float saturation) {
  if (saturation < 0.33) {
    // Modify these colors for low saturation (dull)
    float t = saturation / 0.33;
    return mix(vec3(0.2, 0.4, 1.0), vec3(0.3, 0.7, 1.0), t);
  } else if (saturation < 0.67) {
    // Modify these colors for mid saturation
    float t = (saturation - 0.33) / 0.34;
    return mix(vec3(0.3, 0.7, 1.0), vec3(1.0, 1.0, 0.3), t);
  } else {
    // Modify these colors for high saturation (vivid)
    float t = (saturation - 0.67) / 0.33;
    return mix(vec3(1.0, 1.0, 0.3), vec3(1.0, 0.3, 0.3), t);
  }
}
```

Color values are in RGB format (0.0-1.0 range). Common color examples:
- Blue: `(0.0, 0.0, 1.0)`
- Green: `(0.0, 1.0, 0.0)`
- Red: `(1.0, 0.0, 0.0)`
- Cyan: `(0.0, 1.0, 1.0)`
- Magenta: `(1.0, 0.0, 1.0)`
- Yellow: `(1.0, 1.0, 0.0)`

### Restoring Saturation Threshold Filtering

If you want to only show the gradient map for colors above a certain saturation threshold (like the old behavior), modify the saturation warning condition:

**Current (shows all saturation levels):**
```glsl
if (saturationWarnings > 0.5 && highest > saturationBrightnessThreshold / 100.0) {
  vec3 gradientColor = saturationGradient(saturation);
  outputColor = mix(outputColor, gradientColor, 0.6);
}
```

**With threshold filtering (shows gradient only for saturated colors):**
```glsl
if (saturationWarnings > 0.5 && highest > saturationBrightnessThreshold / 100.0 && saturation >= saturationThreshold / 100.0) {
  vec3 gradientColor = saturationGradient(saturation);
  outputColor = mix(outputColor, gradientColor, 0.6);
}
```

This will make the UI "Saturation threshold" control active again, only showing the gradient map for colors meeting or exceeding the threshold.
