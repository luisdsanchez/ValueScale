# Saturation Gradient Map - Usage Guide

## What Changed?

The **Saturation Warnings** feature now displays artwork as a **colored heatmap** showing saturation levels, rather than magenta stripes. This helps you quickly identify which areas of your artwork are dull (desaturated) vs. vibrant (highly saturated).

## How It Works

When you enable **Saturation Warnings** (press **S!** in the quick controls), every pixel in the artwork gets colored based on how saturated it is:

### Color Gradient Scale

```
Dull / Desaturated                    Vibrant / Highly Saturated
     |                                      |
  Blue  ---->  Cyan  ---->  Yellow  ---->  Red
 (0%)    (33%)  (50%)  (67%)  (83%)  (100%)
```

## Examples

### Example 1: Poster with Muted & Vibrant Areas
- **Muted background**: Displays in blue tones (low saturation)
- **Vibrant character**: Displays in red/orange tones (high saturation)
- **Transition zones**: Show cyan, yellow colors (medium saturation)
- **Result**: Immediately see saturation distribution across composition

### Example 2: Identifying Oversaturated Elements
- Enable saturation warnings while in grayscale mode
- Vibrant elements will show as red/warm colors
- Use this to find areas that might be too saturated for print
- Dull areas appear blue, helping balance composition

### Example 3: Color Consistency Check
- Keep saturation warnings on while viewing original color
- Color gradient overlays the artwork at 60% opacity
- Helps identify colors that are inconsistently saturated
- Useful for character consistency in illustration/animation

## Controls

**Toggle On/Off:**
- Click the **S!** button in the quick controls (right side of projection)
- Or use the settings panel: Settings → Show saturation warnings

**Adjust Threshold:**
- Settings panel → Saturation threshold (default: 85%)
- Affects the minimum brightness at which colors get gradient mapped
- Lower = include darker, less visible saturated colors
- Higher = focus on only the most brightly saturated areas

**Adjust Brightness Minimum:**
- Settings panel → Minimum brightness (default: 10%)
- Only colors brighter than this get the gradient map
- Prevents very dark areas from being colored (since they appear black anyway)
- Lower = more coverage; Higher = less coverage

## Best Practices

### For Digital Art
1. Enable saturation warnings while in **color mode** (Grayscale OFF)
2. Look for red areas - these are most saturated
3. Check if saturation matches your intended color intensity
4. Use to identify if colors are "popping" too much or too little

### For Print Preparation
1. Enable saturation warnings
2. Red/vibrant areas may need desaturation for print
3. Blue/dull areas may need saturation boost
4. This helps prepare files for CMYK printing

### For Animation/Game Art
1. Use to maintain consistent color saturation across frames
2. Keep on while switching between frames/assets
3. Spot inconsistent saturation at a glance
4. Easier than manual color checking

### For Photo Reference
1. When color picking for skin tones, check saturation level
2. Blue indicates desaturated skin (shadows, recessed areas)
3. Red indicates oversaturated skin (harsh lighting, problems)
4. Cyan-yellow indicates natural skin tone saturation

## Comparison with Previous Version

| Feature | Before (Magenta Stripes) | After (Gradient Map) |
|---------|--------------------------|----------------------|
| **Visualization** | Striped overlay | Smooth color gradient |
| **Coverage** | Only areas above threshold | All areas with enough brightness |
| **Information** | Simple warning | Full saturation spectrum |
| **Overlay opacity** | High contrast | 60% blend (preserves artwork) |
| **Performance** | Minimal | Minimal (one function call per pixel) |
| **Usefulness** | "This is saturated" | "How saturated is this?" |

## Tips & Tricks

**Combining with Value Warnings:**
- Enable both **Value Warnings** (V!) and **Saturation Warnings** (S!)
- Blue stripes = dark areas (value warning)
- Colored gradient = saturation levels (saturation warning)
- These can overlap - helps identify both value and saturation issues simultaneously

**For Quick Assessment:**
1. Turn on saturation warnings
2. Quickly glance at the projection
3. Red-heavy image = oversaturated
4. Blue-heavy image = undersaturated
5. Balanced cyan-yellow = good saturation

**Fine-tuning:**
- Adjust "Saturation threshold" slider to show/hide different saturation intensities
- Lower threshold = see even slightly saturated colors as blue
- Higher threshold = see only the most vibrant colors as red

## Need to Customize the Gradient?

The color gradient is defined in `index.html` in the `saturationGradient()` function. If you want different colors:

**Common alternative gradients:**
- **Green to Red** (thermal style): Change blue to green
- **Purple to Yellow** (alternative heatmap): Edit the RGB values
- **Grayscale mode hint**: Map to white→red (shows saturation intensity on grayscale art)

See `SATURATION_GRADIENT_CHANGES.md` for technical details on customization.
