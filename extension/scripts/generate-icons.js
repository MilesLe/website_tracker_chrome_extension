// Simple script to generate placeholder icons
// Run with: node scripts/generate-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple SVG icon
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1976d2"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" fill="white" text-anchor="middle" dominant-baseline="middle">⏱</text>
</svg>`;
}

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  // Note: This creates SVG files. For PNG, you'd need a library like sharp or canvas
  // For now, we'll create SVG files that Chrome can use
  fs.writeFileSync(filePath.replace('.png', '.svg'), svg);
  console.log(`Created icon${size}.svg`);
});

console.log('Icons generated! Note: These are SVG files. For production, convert to PNG.');

