#!/usr/bin/env node
/**
 * Convert SVG icon files to PNG format for Chrome extension.
 * Requires sharp: npm install --save-dev sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, '../public/icons');
const sizes = [16, 48, 128];

async function convertSvgToPng() {
  console.log('Converting SVG icons to PNG...\n');

  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon${size}.svg`);
    const pngPath = path.join(iconsDir, `icon${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.warn(`⚠️  Warning: ${svgPath} not found, skipping...`);
      continue;
    }

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`✅ Created ${path.basename(pngPath)} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error converting ${path.basename(svgPath)}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✨ All icons converted successfully!');
}

convertSvgToPng().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
