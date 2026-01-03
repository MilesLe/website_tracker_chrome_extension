#!/usr/bin/env python3
"""
Generate PNG icons for the Chrome extension.
Requires Pillow: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow is required. Install with: pip install Pillow")
    exit(1)

import os

def create_icon(size):
    """Create a simple icon with a clock emoji/icon"""
    # Create image with blue background
    img = Image.new('RGB', (size, size), color='#1976d2')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple clock icon (circle with hands)
    center = size // 2
    radius = size // 3
    
    # Draw circle
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        fill='white',
        outline='white',
        width=2
    )
    
    # Draw clock hands (simple lines)
    # Hour hand
    draw.line(
        [center, center, center, center - radius // 2],
        fill='#1976d2',
        width=max(2, size // 16)
    )
    # Minute hand
    draw.line(
        [center, center, center + radius // 2, center],
        fill='#1976d2',
        width=max(1, size // 20)
    )
    
    return img

def main():
    icons_dir = os.path.join(os.path.dirname(__file__), '../public/icons')
    os.makedirs(icons_dir, exist_ok=True)
    
    sizes = [16, 48, 128]
    for size in sizes:
        icon = create_icon(size)
        icon_path = os.path.join(icons_dir, f'icon{size}.png')
        icon.save(icon_path)
        print(f'Created {icon_path}')

if __name__ == '__main__':
    main()

