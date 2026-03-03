/**
 * Script: Crea template base IWP con zona foto bianca
 *
 * Approccio semplice: Sharp compositing puro, nessuna API esterna.
 * 1. Converte frame AVIF → PNG (dimensioni originali)
 * 2. Sovrappone un cerchio/rettangolo BIANCO sulla photoZone
 *    → la zona bianca è il placeholder dove l'utente caricherà la foto
 * 3. Salva come PNG in public/templates/bases/
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const AVIF_DIR = path.join(process.cwd(), 'public/templates/base per iwp ');
const OUTPUT_DIR = path.join(process.cwd(), 'public/templates/bases');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

type PhotoZoneCircle = { shape: 'circle'; centerX: number; centerY: number; radius: number };
type PhotoZoneRect  = { shape: 'rect'; x: number; y: number; width: number; height: number };
type PhotoZone = PhotoZoneCircle | PhotoZoneRect;

interface IWPTemplate {
  id: string;
  name: string;
  avifFile: string;
  photoZone: PhotoZone;
}

const IWP_TEMPLATES: IWPTemplate[] = [
  {
    id: 'iwp-masterclass',
    name: 'Masterclass US Wine Market',
    avifFile: '1a4fd2c120f3426d2349825be80514b9.avif',
    photoZone: { shape: 'circle', centerX: 500, centerY: 390, radius: 228 },
  },
  {
    id: 'iwp-wine-food-travel',
    name: 'Wine Food & Travel',
    avifFile: '6b5de91634f6d4a7cf8dd8c0f5710c19.avif',
    photoZone: { shape: 'circle', centerX: 500, centerY: 385, radius: 220 },
  },
  {
    id: 'iwp-on-the-road',
    name: 'On The Road Edition',
    avifFile: '1ec3e6ec08896c3d4a7ad4e811164336.avif',
    photoZone: { shape: 'circle', centerX: 500, centerY: 390, radius: 228 },
  },
  {
    id: 'iwp-open-bar-stevie',
    name: '#OpenBarStevie',
    avifFile: '4775e089917abe2cbc801ee41c24dc6d.avif',
    photoZone: { shape: 'circle', centerX: 500, centerY: 385, radius: 218 },
  },
  {
    id: 'iwp-wine2wine',
    name: 'wine2wine Vinitaly Business Forum',
    avifFile: 'cc783ac13ff5587eb7aa75776a26f602.avif',
    photoZone: { shape: 'rect', x: 0, y: 150, width: 1001, height: 590 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Processa un singolo template: riempie la photoZone di bianco
// ─────────────────────────────────────────────────────────────────────────────
async function processTemplate(tpl: IWPTemplate): Promise<void> {
  const avifPath = path.join(AVIF_DIR, tpl.avifFile);
  const outputPath = path.join(OUTPUT_DIR, `${tpl.id}-base.png`);

  console.log(`\n📐 ${tpl.name}`);
  if (!fs.existsSync(avifPath)) {
    console.error(`   ❌ File non trovato: ${avifPath}`);
    return;
  }

  // 1. AVIF → PNG (dimensioni originali)
  console.log(`   🔄 Conversione AVIF → PNG...`);
  const framePng = await sharp(avifPath).png().toBuffer();
  const { width: fw, height: fh } = await sharp(framePng).metadata();
  console.log(`   📏 ${fw}x${fh}px`);

  // 2. SVG con forma bianca nella photoZone
  const zone = tpl.photoZone;
  let shapeSvg: string;
  if (zone.shape === 'circle') {
    console.log(`   ⭕ Zona: cerchio (${zone.centerX},${zone.centerY}) r=${zone.radius}`);
    shapeSvg = `<svg width="${fw}" height="${fh}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${zone.centerX}" cy="${zone.centerY}" r="${zone.radius}" fill="white"/>
    </svg>`;
  } else {
    console.log(`   ▭  Zona: rect (${zone.x},${zone.y}) ${zone.width}×${zone.height}`);
    shapeSvg = `<svg width="${fw}" height="${fh}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}" fill="white"/>
    </svg>`;
  }

  // 3. Composita zona bianca sul frame
  const result = await sharp(framePng)
    .composite([{ input: Buffer.from(shapeSvg), blend: 'over' }])
    .png({ compressionLevel: 7 })
    .toBuffer();

  fs.writeFileSync(outputPath, result);
  const { size } = fs.statSync(outputPath);
  console.log(`   ✅ Salvato: ${path.basename(outputPath)} (${(size / 1024 / 1024).toFixed(2)} MB)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎨 Template IWP — Zona Foto Bianca (Sharp compositing)');
  console.log('══════════════════════════════════════════════════════════════');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY mancante');
    process.exit(1);
  }

  // Processa solo i template specificati dalla CLI, o tutti se nessuno specificato
  const only = process.argv.slice(2);
  const toProcess = only.length
    ? IWP_TEMPLATES.filter((t) => only.includes(t.id))
    : IWP_TEMPLATES;

  if (!toProcess.length) {
    console.error(`❌ Nessun template trovato per: ${only.join(', ')}`);
    console.log('Disponibili:', IWP_TEMPLATES.map((t) => t.id).join(', '));
    process.exit(1);
  }

  for (const tpl of toProcess) {
    await processTemplate(tpl);
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('✨ Completato!');
}

main().catch(console.error);
