import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseIconPath = path.join(__dirname, '../attached_assets/Asset 1anointed io icon_1762118618208.png');
const publicDir = path.join(__dirname, '../public');

async function generateLogo() {
  try {
    console.log('Creating logo.png (256x256) for Schema.org...');
    
    await sharp(baseIconPath)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'logo.png'));

    console.log('✅ logo.png created successfully!');
  } catch (error) {
    console.error('Error generating logo:', error);
    process.exit(1);
  }
}

generateLogo();
