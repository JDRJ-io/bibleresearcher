import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseIconPath = path.join(__dirname, '../attached_assets/anointed io fire crown halo_1762247373247.png');
const publicDir = path.join(__dirname, '../client/public');

async function generateIcons() {
  try {
    console.log('Reading base icon...');
    // Trim transparent padding for tighter icon
    const trimmedBuffer = await sharp(baseIconPath).trim().toBuffer();
    const baseImage = sharp(trimmedBuffer);
    const metadata = await baseImage.metadata();
    console.log(`Base icon size (after trim): ${metadata.width}x${metadata.height}`);

    // 1. Create favicons in various sizes
    console.log('Creating favicon-48.png...');
    await baseImage
      .clone()
      .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-48.png'));

    console.log('Creating favicon-32x32.png...');
    await baseImage
      .clone()
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));

    console.log('Creating favicon-16x16.png...');
    await baseImage
      .clone()
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));

    console.log('Creating favicon.ico...');
    await baseImage
      .clone()
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(publicDir, 'favicon.ico'));

    console.log('Creating apple-touch-icon.png...');
    await baseImage
      .clone()
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    console.log('Creating logo.png...');
    await baseImage
      .clone()
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'logo.png'));

    console.log('Creating android-chrome-192x192.png...');
    await baseImage
      .clone()
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'android-chrome-192x192.png'));

    console.log('Creating android-chrome-512x512.png...');
    await baseImage
      .clone()
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'android-chrome-512x512.png'));

    console.log('Creating crown-icon.png (for UI elements)...');
    await baseImage
      .clone()
      .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'crown-icon.png'));

    // 2. Create icon-512-maskable.png (512x512 with safe padding)
    // For maskable icons, we need to shrink the icon to 80% and center it
    // This ensures the icon isn't cropped when Android applies circular masks
    console.log('Creating icon-512-maskable.png...');
    const iconSize = 512;
    const safeZoneSize = Math.floor(iconSize * 0.8); // 80% for safe zone
    const padding = Math.floor((iconSize - safeZoneSize) / 2);
    
    await sharp({
      create: {
        width: iconSize,
        height: iconSize,
        channels: 4,
        background: { r: 11, g: 15, b: 25, alpha: 1 } // #0b0f19 dark background
      }
    })
    .composite([{
      input: await sharp(baseIconPath)
        .resize(safeZoneSize, safeZoneSize, { fit: 'contain' })
        .toBuffer(),
      top: padding,
      left: padding
    }])
    .png()
    .toFile(path.join(publicDir, 'icons/icon-512-maskable.png'));

    // 3. Create og-image.png (1200x630) - Social media preview
    console.log('Creating og-image.png...');
    const ogWidth = 1200;
    const ogHeight = 630;
    const ogIconSize = 300;
    
    // Create background
    const ogBackground = sharp({
      create: {
        width: ogWidth,
        height: ogHeight,
        channels: 4,
        background: { r: 11, g: 15, b: 25, alpha: 1 } // #0b0f19
      }
    });

    // Overlay icon and text
    const iconBuffer = await sharp(baseIconPath)
      .resize(ogIconSize, ogIconSize, { fit: 'contain' })
      .toBuffer();

    // Create text overlay using SVG
    const textSvg = `
      <svg width="${ogWidth}" height="${ogHeight}">
        <text x="650" y="260" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#ffffff">Anointed.io</text>
        <text x="650" y="340" font-family="Arial, sans-serif" font-size="32" fill="#9ca3af">Bible study that flows</text>
        <text x="650" y="400" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">Multi-translation study with cross-refs,</text>
        <text x="650" y="440" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">prophecy overlays, Strong's, and notes</text>
      </svg>
    `;

    await ogBackground
      .composite([
        {
          input: iconBuffer,
          top: Math.floor((ogHeight - ogIconSize) / 2),
          left: 100
        },
        {
          input: Buffer.from(textSvg),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));

    // 4. Create safari-pinned-tab.svg (monochrome SVG)
    console.log('Creating safari-pinned-tab.svg...');
    const safariSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" rx="3" fill="#000"/>
  <path d="M 4 3 L 4 13 L 12 13 L 12 11 L 6 11 L 6 5 L 12 5 L 12 3 Z" fill="#fff" stroke="#fff" stroke-width="0.5"/>
</svg>`;
    
    fs.writeFileSync(path.join(publicDir, 'safari-pinned-tab.svg'), safariSvg);

    console.log('✅ All icons generated successfully!');
    console.log('Generated files:');
    console.log('  - favicon-48.png');
    console.log('  - favicon-32x32.png');
    console.log('  - favicon-16x16.png');
    console.log('  - favicon.ico');
    console.log('  - apple-touch-icon.png');
    console.log('  - logo.png');
    console.log('  - android-chrome-192x192.png');
    console.log('  - android-chrome-512x512.png');
    console.log('  - crown-icon.png (128x128 for UI elements)');
    console.log('  - icons/icon-512-maskable.png');
    console.log('  - og-image.png');
    console.log('  - safari-pinned-tab.svg');
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
