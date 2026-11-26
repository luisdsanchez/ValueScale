# WebGL Fragment Shader - Complete Code Reference

This document shows the complete modified fragment shader code with the saturation gradient mapping implementation.

## Full Fragment Shader Code

```glsl
precision highp float;
varying vec2 uv;
uniform sampler2D tex;
uniform vec4 crop;
uniform float levels;
uniform float bright;
uniform float contrast;
uniform float posterize;
uniform float grayscaleEnabled;
uniform float valueWarnings;
uniform float darkThreshold;
uniform float lightThreshold;
uniform float saturationWarnings;
uniform float saturationThreshold;
uniform float saturationBrightnessThreshold;
uniform float pixelRatio;

vec3 warningOverlay(vec3 base, vec3 color, float direction, float stripeOpacity) {
  float stripe = 1.0 - step(6.0, mod((gl_FragCoord.x + direction * gl_FragCoord.y) / pixelRatio, 12.0));
  return mix(base, color, 0.1 + stripe * (stripeOpacity - 0.1));
}

vec3 saturationGradient(float saturation) {
  if (saturation < 0.33) {
    // Low saturation: blue (dull)
    float t = saturation / 0.33;
    return mix(vec3(0.2, 0.4, 1.0), vec3(0.3, 0.7, 1.0), t);
  } else if (saturation < 0.67) {
    // Mid saturation: cyan to yellow
    float t = (saturation - 0.33) / 0.34;
    return mix(vec3(0.3, 0.7, 1.0), vec3(1.0, 1.0, 0.3), t);
  } else {
    // High saturation: yellow to red (vivid)
    float t = (saturation - 0.67) / 0.33;
    return mix(vec3(1.0, 1.0, 0.3), vec3(1.0, 0.3, 0.3), t);
  }
}

void main() {
  // Sample texture
  vec3 c = texture2D(tex, crop.xy + uv * crop.zw).rgb;
  
  // Calculate luminance (grayscale value)
  float grayscale = dot(c, vec3(0.2126, 0.7152, 0.0722));
  
  // Apply brightness and contrast adjustments
  float adjusted = clamp((grayscale - 0.5) * contrast + 0.5 + bright / 100.0, 0.0, 1.0);
  
  // Posterize (quantize to discrete levels)
  float q = min(floor(adjusted * levels), levels - 1.0) / (levels - 1.0);
  
  // Choose between posterized or original grayscale
  float outputValue = posterize > 0.5 ? q : grayscale;
  
  // Apply grayscale effect or use original color
  vec3 outputColor = grayscaleEnabled > 0.5 ? vec3(outputValue) : c;
  
  // Apply value warnings (dark/light areas)
  if (valueWarnings > 0.5) {
    if (grayscale <= darkThreshold) {
      outputColor = warningOverlay(outputColor, vec3(0.35, 0.82, 1.0), 1.0, 0.4);
    } else if (grayscale >= lightThreshold) {
      outputColor = warningOverlay(outputColor, vec3(1.0, 0.62, 0.35), -1.0, 0.4);
    }
  }
  
  // Calculate saturation from original color
  float highest = max(c.r, max(c.g, c.b));
  float lowest = min(c.r, min(c.g, c.b));
  float saturation = highest > 0.0 ? (highest - lowest) / highest : 0.0;
  
  // Apply saturation gradient mapping
  if (saturationWarnings > 0.5 && highest > saturationBrightnessThreshold / 100.0) {
    vec3 gradientColor = saturationGradient(saturation);
    outputColor = mix(outputColor, gradientColor, 0.6);
  }
  
  // Output final color
  gl_FragColor = vec4(outputColor, 1.0);
}
```

## Shader Uniforms

| Uniform | Type | Range | Purpose |
|---------|------|-------|---------|
| `tex` | sampler2D | - | Captured video texture |
| `crop` | vec4 | 0-1 | Crop region (x, y, w, h) |
| `levels` | float | 2-10 | Number of gray levels for posterization |
| `bright` | float | -50 to 50 | Brightness adjustment |
| `contrast` | float | 0.5-2.0 | Contrast multiplier |
| `posterize` | float | 0 or 1 | Enable/disable posterization |
| `grayscaleEnabled` | float | 0 or 1 | Enable/disable grayscale |
| `valueWarnings` | float | 0 or 1 | Show value warnings (dark/light) |
| `darkThreshold` | float | 0-1 | Threshold for dark value warning |
| `lightThreshold` | float | 0-1 | Threshold for light value warning |
| `saturationWarnings` | float | 0 or 1 | Show saturation gradient map |
| `saturationThreshold` | float | 0-1 | **Unused** (kept for backward compatibility) |
| `saturationBrightnessThreshold` | float | 0-1 | Minimum brightness to show saturation |
| `pixelRatio` | float | ≥1 | Device pixel ratio for stripe frequency |

## Gradient Color Stops

### Saturation Gradient Function

The gradient maps saturation (0.0 to 1.0) through three color ranges:

```
0.0 ━━━━━ 0.33 ━━━━━ 0.67 ━━━━━ 1.0
 │         │          │          │
 └─────────┴──────────┴──────────┘
   Blue   Cyan  Yellow   Red
  (Dull) (Moderate) (Vivid)
```

### RGB Values

| Range | From | To |
|-------|------|-----|
| 0.0 - 0.33 | (0.2, 0.4, 1.0) [Dark Blue] | (0.3, 0.7, 1.0) [Light Blue] |
| 0.33 - 0.67 | (0.3, 0.7, 1.0) [Cyan] | (1.0, 1.0, 0.3) [Yellow] |
| 0.67 - 1.0 | (1.0, 1.0, 0.3) [Yellow] | (1.0, 0.3, 0.3) [Red] |

## Blending

Final color calculation for saturation visualization:

```glsl
outputColor = mix(originalColor, gradientColor, 0.6);
```

This creates a 60% opacity blend:
- 60% of the gradient color
- 40% of the original artwork color
- Result: Gradient visible but artwork still readable

## Performance Notes

- **Fragment Shader Complexity**: Moderate (adds ~20 operations per pixel)
- **Functions Called per Pixel** (when enabled): 2 (`warningOverlay`, `saturationGradient`)
- **WebGL Version**: 1.0 compatible
- **GPU Memory**: No additional texture storage
- **Conditional Branches**: 3 (saturation gradient interpolation)

## Color Space

- **Input**: RGB (from video capture, 0-1 normalized)
- **Saturation Calculation**: HSV saturation formula
  - `saturation = (max - min) / max`
  - Based on highest and lowest RGB channels
- **Output**: RGB (0-1 normalized)
- **Display**: sRGB (standard for web)

## Common Customizations

### Create a Thermal Heatmap (Blue to Red Directly)

```glsl
vec3 saturationGradient(float saturation) {
  return mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), saturation);
}
```

### Create a Purple to Yellow Gradient

```glsl
vec3 saturationGradient(float saturation) {
  return mix(vec3(0.5, 0.0, 1.0), vec3(1.0, 1.0, 0.0), saturation);
}
```

### Create a Grayscale Intensity Map

```glsl
vec3 saturationGradient(float saturation) {
  return vec3(saturation);
}
```

### Add Threshold Filtering (Original Behavior)

Modify the if condition:

```glsl
if (saturationWarnings > 0.5 && highest > saturationBrightnessThreshold / 100.0 && saturation >= saturationThreshold / 100.0) {
  vec3 gradientColor = saturationGradient(saturation);
  outputColor = mix(outputColor, gradientColor, 0.6);
}
```

## Troubleshooting

### Gradient Not Visible
- Check that saturation warnings are enabled in UI (S! button)
- Verify brightness threshold isn't too high
- Try on an image with saturated colors

### Gradient Colors Look Wrong
- Ensure RGB values are in 0.0-1.0 range, not 0-255
- Use `(r/255.0, g/255.0, b/255.0)` to convert from 8-bit values
- Check WebGL console for shader compilation errors

### Performance Issues
- Unlikely (shader is simple), but if present:
  - Reduce device pixel ratio
  - Check GPU memory usage
  - Consider reducing blend opacity (0.6)

### Not Working with Grayscale Mode
- This is correct behavior - saturation is computed from original color
- Gradient displays even when grayscale effect is applied
- Use to identify saturation of underlying colors in grayscale view
