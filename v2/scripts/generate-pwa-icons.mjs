/**
 * Genera los iconos PNG necesarios para PWA a partir del favicon.svg.
 *
 *   public/pwa-192x192.png        → manifest icon
 *   public/pwa-512x512.png        → manifest icon
 *   public/pwa-maskable-512.png   → icono "maskable" (con padding extra)
 *   public/apple-touch-icon.png   → iOS home screen (180×180)
 *   public/favicon-32.png         → favicon clásico
 *
 * Uso: `node scripts/generate-pwa-icons.mjs`
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'favicon.svg');

if (!fs.existsSync(svgPath)) {
  console.error('No se encuentra public/favicon.svg');
  process.exit(1);
}

const svgBuffer = fs.readFileSync(svgPath);

/** Genera un PNG simple a partir del SVG (icono "any") */
async function generate(size, outName) {
  const out = path.join(publicDir, outName);
  await sharp(svgBuffer)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
  console.log(`✓ ${outName}  (${size}×${size})`);
}

/** Genera un PNG "maskable" — añade padding del 10% para que iconos circulares no recorten contenido */
async function generateMaskable(size, outName) {
  const out = path.join(publicDir, outName);
  // Renderizamos el SVG a un tamaño reducido y lo centramos sobre fondo del mismo color del SVG
  const innerSize = Math.round(size * 0.78);
  const padding = Math.round((size - innerSize) / 2);
  const innerSvg = await sharp(svgBuffer).resize(innerSize, innerSize).png().toBuffer();
  // Fondo: azul de la marca (#1e40af) para que se vea bien en cualquier máscara
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 30, g: 64, b: 175, alpha: 1 }
    }
  })
    .composite([{ input: innerSvg, top: padding, left: padding }])
    .png()
    .toFile(out);
  console.log(`✓ ${outName}  (${size}×${size} maskable)`);
}

await generate(192, 'pwa-192x192.png');
await generate(512, 'pwa-512x512.png');
await generateMaskable(512, 'pwa-maskable-512.png');
await generate(180, 'apple-touch-icon.png');
await generate(32, 'favicon-32.png');
console.log('\n🎨 Iconos generados en public/');
