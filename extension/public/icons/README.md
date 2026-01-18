# Extension Icons

This directory should contain PNG icon files for the extension:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

## Generating Icons

### Option 1: Convert SVG to PNG (Recommended)
If you have SVG icons and want to convert them to PNG:
```bash
npm run icons:convert
```
This uses the `sharp` library to convert existing SVG files to PNG format.

### Option 2: Using Python (Pillow)
```bash
pip install Pillow
python3 ../scripts/generate-icons.py
```

### Option 3: Using ImageMagick
```bash
# Install ImageMagick first, then:
for size in 16 48 128; do
  convert -size ${size}x${size} xc:'#1976d2' \
    -pointsize $((size/2)) -fill white -gravity center \
    -annotate +0+0 '⏱' icon${size}.png
done
```

### Option 4: Manual Creation
Create PNG files with a blue background (#1976d2) and a clock/timer icon in white.

## Current Status

✅ PNG icons are available and ready for use. SVG source files are also kept for easy editing and regeneration.

