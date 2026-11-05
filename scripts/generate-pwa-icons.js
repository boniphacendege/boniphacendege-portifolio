import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SVG_CONTENT = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#052816" />
      <stop offset="70%" stop-color="#02140b" />
      <stop offset="100%" stop-color="#010603" />
    </radialGradient>
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff1b8" />
      <stop offset="45%" stop-color="#f0b92e" />
      <stop offset="100%" stop-color="#b8841a" />
    </linearGradient>
    <linearGradient id="neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5aff9f" />
      <stop offset="50%" stop-color="#3dff8f" />
      <stop offset="100%" stop-color="#0f7a43" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Dark Rich Emerald Background -->
  <rect width="512" height="512" rx="100" fill="url(#bg-grad)" />

  <!-- Outer Neon Gold Rings -->
  <circle cx="256" cy="256" r="218" stroke="url(#gold-grad)" stroke-width="8" />
  <circle cx="256" cy="256" r="196" stroke="url(#neon-grad)" stroke-width="4" stroke-dasharray="12 8" opacity="0.8" />
  <circle cx="256" cy="256" r="180" stroke="url(#gold-grad)" stroke-width="2" opacity="0.4" />

  <!-- Monogram BN / Stylized Creative Geometric Mark -->
  <!-- 'B' letter in bold gold with serif crown -->
  <path d="M165 145 H255 C295 145 325 168 325 208 C325 238 302 260 265 266 C310 274 338 302 338 344 C338 388 300 415 255 415 H165 V145 Z M215 250 H248 C270 250 285 238 285 212 C285 186 270 176 248 176 H215 V250 Z M215 384 H252 C278 384 296 370 296 342 C296 314 278 302 250 302 H215 V384 Z" fill="url(#gold-grad)" filter="url(#glow)"/>

  <!-- 'N' dynamic neon slash -->
  <path d="M305 145 L385 415 H352 L272 145 H305 Z" fill="url(#neon-grad)" opacity="0.9" />

  <!-- Corner Emerald & Gold Accent Ornaments -->
  <circle cx="256" cy="38" r="8" fill="#3dff8f" />
  <circle cx="256" cy="474" r="8" fill="#f0b92e" />
  <circle cx="38" cy="256" r="8" fill="#f0b92e" />
  <circle cx="474" cy="256" r="8" fill="#3dff8f" />
</svg>`;

const MASKABLE_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="m-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#052816" />
      <stop offset="70%" stop-color="#02140b" />
      <stop offset="100%" stop-color="#010603" />
    </radialGradient>
    <linearGradient id="m-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff1b8" />
      <stop offset="45%" stop-color="#f0b92e" />
      <stop offset="100%" stop-color="#b8841a" />
    </linearGradient>
    <linearGradient id="m-neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5aff9f" />
      <stop offset="50%" stop-color="#3dff8f" />
      <stop offset="100%" stop-color="#0f7a43" />
    </linearGradient>
  </defs>

  <!-- Full-bleed background for maskable (safe zone padding inside 80% circle) -->
  <rect width="512" height="512" fill="url(#m-bg)" />

  <g transform="translate(51, 51) scale(0.8)">
    <circle cx="256" cy="256" r="218" stroke="url(#m-gold)" stroke-width="10" />
    <circle cx="256" cy="256" r="196" stroke="url(#m-neon)" stroke-width="5" stroke-dasharray="14 10" opacity="0.85" />
    
    <path d="M165 145 H255 C295 145 325 168 325 208 C325 238 302 260 265 266 C310 274 338 302 338 344 C338 388 300 415 255 415 H165 V145 Z M215 250 H248 C270 250 285 238 285 212 C285 186 270 176 248 176 H215 V250 Z M215 384 H252 C278 384 296 370 296 342 C296 314 278 302 250 302 H215 V384 Z" fill="url(#m-gold)"/>
    <path d="M305 145 L385 415 H352 L272 145 H305 Z" fill="url(#m-neon)" opacity="0.95" />
  </g>
</svg>`;

async function run() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), SVG_CONTENT, 'utf8');
  console.log('Created public/icon.svg');

  // 2. 512x512 standard PNG
  await sharp(Buffer.from(SVG_CONTENT))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created public/pwa-512x512.png');

  // 3. 192x192 standard PNG
  await sharp(Buffer.from(SVG_CONTENT))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created public/pwa-192x192.png');

  // 4. 180x180 apple-touch-icon.png
  await sharp(Buffer.from(SVG_CONTENT))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png');

  // 5. 512x512 maskable PNG (safe-zone padded)
  await sharp(Buffer.from(MASKABLE_SVG))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created public/pwa-maskable-512x512.png');

  // 6. 64x64 favicon.ico (as PNG wrapped or small icon)
  await sharp(Buffer.from(SVG_CONTENT))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created public/favicon.ico');
}

run().catch(console.error);
