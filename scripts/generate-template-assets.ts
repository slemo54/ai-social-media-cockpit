/**
 * Script: Generazione Assets Template
 * Crea silhouette placeholder e assets grafici di base
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Ensure output directory exists
const OUTPUT_DIR = path.resolve(__dirname, '../public/templates/assets');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Creata directory: ${OUTPUT_DIR}\n`);
}

interface AssetConfig {
  name: string;
  width: number;
  height: number;
  type: 'portrait' | 'bust' | 'circle' | 'duo' | 'square';
  description: string;
}

const ASSETS_CONFIG: AssetConfig[] = [
  { name: 'demo-figure-portrait', width: 400, height: 600, type: 'portrait', description: 'Figura intera stilizzata per template verticali' },
  { name: 'demo-figure-bust', width: 400, height: 400, type: 'bust', description: 'Busto/ritratto per template square' },
  { name: 'demo-figure-circle', width: 500, height: 500, type: 'circle', description: 'Figura circolare per template podcast' },
  { name: 'demo-figure-duo', width: 800, height: 500, type: 'duo', description: 'Due figure per template masterclass' },
  { name: 'demo-figure-square', width: 500, height: 500, type: 'square', description: 'Figura quadrata generica' },
];

/**
 * Genera una silhouette PNG
 */
async function generateSilhouette(config: AssetConfig): Promise<Buffer> {
  const { width, height, type } = config;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Sfondo trasparente
  ctx.clearRect(0, 0, width, height);

  // Colore silhouette - nero elegante
  ctx.fillStyle = '#1a1a1a';

  switch (type) {
    case 'portrait':
      drawPortraitFigure(ctx, width, height);
      break;
    case 'bust':
      drawBustFigure(ctx, width, height);
      break;
    case 'circle':
      drawCircleFigure(ctx, width, height);
      break;
    case 'duo':
      drawDuoFigures(ctx, width, height);
      break;
    case 'square':
      drawSquareFigure(ctx, width, height);
      break;
  }

  return canvas.toBuffer('image/png');
}

function drawPortraitFigure(ctx: any, w: number, h: number) {
  const cx = w / 2;
  
  ctx.beginPath();
  
  // Testa
  const headY = h * 0.12;
  const headRx = w * 0.12;
  const headRy = w * 0.14;
  ctx.ellipse(cx, headY, headRx, headRy, 0, 0, Math.PI * 2);
  
  // Collo
  ctx.moveTo(cx - headRx * 0.4, headY + headRy);
  ctx.lineTo(cx - headRx * 0.35, headY + headRy * 2.5);
  ctx.lineTo(cx + headRx * 0.35, headY + headRy * 2.5);
  ctx.lineTo(cx + headRx * 0.4, headY + headRy);
  
  // Spalle
  const shoulderY = h * 0.35;
  const shoulderW = w * 0.38;
  
  ctx.moveTo(cx - shoulderW, shoulderY);
  // Braccio sinistro
  ctx.bezierCurveTo(
    cx - shoulderW * 1.1, shoulderY + h * 0.15,
    cx - shoulderW * 0.9, shoulderY + h * 0.35,
    cx - shoulderW * 0.7, h * 0.75
  );
  // Fianco sinistro
  ctx.lineTo(cx - shoulderW * 0.25, h * 0.92);
  // Base
  ctx.lineTo(cx + shoulderW * 0.25, h * 0.92);
  // Fianco destro
  ctx.lineTo(cx + shoulderW * 0.7, h * 0.75);
  // Braccio destro
  ctx.bezierCurveTo(
    cx + shoulderW * 0.9, shoulderY + h * 0.35,
    cx + shoulderW * 1.1, shoulderY + h * 0.15,
    cx + shoulderW, shoulderY
  );
  
  ctx.closePath();
  ctx.fill();
}

function drawBustFigure(ctx: any, w: number, h: number) {
  const cx = w / 2;
  
  ctx.beginPath();
  
  // Testa più grande (bust)
  const headY = h * 0.25;
  const headRx = w * 0.18;
  const headRy = w * 0.2;
  ctx.ellipse(cx, headY, headRx, headRy, 0, 0, Math.PI * 2);
  
  // Collo
  ctx.moveTo(cx - headRx * 0.4, headY + headRy * 0.8);
  ctx.lineTo(cx - headRx * 0.5, headY + headRy * 1.8);
  ctx.lineTo(cx + headRx * 0.5, headY + headRy * 1.8);
  ctx.lineTo(cx + headRx * 0.4, headY + headRy * 0.8);
  
  // Spalle e torso
  const shoulderY = h * 0.55;
  const shoulderW = w * 0.45;
  
  ctx.moveTo(cx - shoulderW, shoulderY);
  ctx.quadraticCurveTo(cx - shoulderW * 0.7, h * 0.85, cx - shoulderW * 0.3, h * 0.95);
  ctx.lineTo(cx + shoulderW * 0.3, h * 0.95);
  ctx.quadraticCurveTo(cx + shoulderW * 0.7, h * 0.85, cx + shoulderW, shoulderY);
  
  ctx.closePath();
  ctx.fill();
}

function drawCircleFigure(ctx: any, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.45;
  
  // Clip circolare
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  
  // Sfondo grigio chiaro per visibilità
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, w, h);
  
  // Figura stilizzata nel cerchio
  ctx.fillStyle = '#1a1a1a';
  
  // Testa
  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.25, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Spalle
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.4, radius * 0.55, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  
  // Bordo cerchio
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawDuoFigures(ctx: any, w: number, h: number) {
  // Prima figura (sinistra)
  ctx.save();
  ctx.translate(w * 0.25, 0);
  drawPortraitFigure(ctx, w * 0.5, h);
  ctx.restore();
  
  // Seconda figura (destra)
  ctx.save();
  ctx.translate(w * 0.75, 0);
  drawPortraitFigure(ctx, w * 0.5, h);
  ctx.restore();
  
  // Linea separazione sottile
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(w / 2, h * 0.1);
  ctx.lineTo(w / 2, h * 0.9);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawSquareFigure(ctx: any, w: number, h: number) {
  const cx = w / 2;
  
  ctx.beginPath();
  
  // Testa
  const headY = h * 0.25;
  const headRx = w * 0.16;
  const headRy = w * 0.18;
  ctx.ellipse(cx, headY, headRx, headRy, 0, 0, Math.PI * 2);
  
  // Collo
  ctx.moveTo(cx - headRx * 0.4, headY + headRy);
  ctx.lineTo(cx - headRx * 0.45, headY + headRy * 2);
  ctx.lineTo(cx + headRx * 0.45, headY + headRy * 2);
  ctx.lineTo(cx + headRx * 0.4, headY + headRy);
  
  // Spalle
  const shoulderY = h * 0.5;
  const shoulderW = w * 0.4;
  
  ctx.moveTo(cx - shoulderW, shoulderY);
  ctx.quadraticCurveTo(cx - shoulderW * 0.8, h * 0.75, cx - shoulderW * 0.3, h * 0.9);
  ctx.lineTo(cx + shoulderW * 0.3, h * 0.9);
  ctx.quadraticCurveTo(cx + shoulderW * 0.8, h * 0.75, cx + shoulderW, shoulderY);
  
  ctx.closePath();
  ctx.fill();
}

/**
 * Genera SVG scalabile
 */
function generateSVG(config: AssetConfig): string {
  const { width, height, type } = config;
  
  let pathD = '';
  
  switch (type) {
    case 'portrait':
      pathD = `M${width/2},${height*0.12} 
               m-${width*0.12},0 
               a${width*0.12},${width*0.14} 0 1,0 ${width*0.24},0 
               a${width*0.12},${width*0.14} 0 1,0 -${width*0.24},0
               M${width/2 - width*0.046},${height*0.28}
               L${width/2 - width*0.04},${height*0.35}
               L${width/2 + width*0.04},${height*0.35}
               L${width/2 + width*0.046},${height*0.28}
               M${width/2 - width*0.38},${height*0.35}
               Q${width/2 - width*0.42},${height*0.5} ${width/2 - width*0.26},${height*0.75}
               L${width/2 - width*0.09},${height*0.92}
               L${width/2 + width*0.09},${height*0.92}
               L${width/2 + width*0.26},${height*0.75}
               Q${width/2 + width*0.42},${height*0.5} ${width/2 + width*0.38},${height*0.35}
               Z`;
      break;
    case 'circle':
      pathD = `M${width/2},${height/2} m-${Math.min(width,height)*0.45},0 
               a${Math.min(width,height)*0.45},${Math.min(width,height)*0.45} 0 1,0 ${Math.min(width,height)*0.9},0 
               a${Math.min(width,height)*0.45},${Math.min(width,height)*0.45} 0 1,0 -${Math.min(width,height)*0.9},0`;
      break;
    default:
      pathD = `M${width/2},${height*0.25} m-${width*0.18},0 a${width*0.18},${width*0.2} 0 1,0 ${width*0.36},0 a${width*0.18},${width*0.2} 0 1,0 -${width*0.36},0`;
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      .silhouette { fill: #1a1a1a; }
      .outline { fill: none; stroke: #333333; stroke-width: 2; stroke-dasharray: 5,5; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="transparent"/>
  <path class="silhouette" d="${pathD}"/>
  <text x="50%" y="95%" text-anchor="middle" font-family="system-ui" font-size="14" fill="#666666">
    Upload your photo here
  </text>
</svg>`;
}

/**
 * Upload file a Supabase Storage
 */
async function uploadToStorage(
  filePath: string, 
  buffer: Buffer, 
  contentType: string
): Promise<string | null> {
  const fileName = path.basename(filePath);
  const storagePath = `assets/${fileName}`;
  
  const { error } = await supabase.storage
    .from('template-assets')
    .upload(storagePath, buffer, {
      contentType,
      upsert: true
    });
  
  if (error) {
    console.error(`   ❌ Errore upload ${fileName}:`, error.message);
    return null;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('template-assets')
    .getPublicUrl(storagePath);
  
  return publicUrl;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Generazione Assets Template\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];

  for (const config of ASSETS_CONFIG) {
    console.log(`📐 ${config.name} (${config.type})`);
    console.log(`   ${config.description}`);
    console.log(`   Dimensioni: ${config.width}x${config.height}px`);

    try {
      // Genera PNG
      const pngBuffer = await generateSilhouette(config);
      const pngPath = path.join(OUTPUT_DIR, `${config.name}.png`);
      fs.writeFileSync(pngPath, pngBuffer);
      console.log(`   ✅ PNG: ${pngPath.replace(OUTPUT_DIR, '')}`);

      // Genera SVG
      const svgContent = generateSVG(config);
      const svgPath = path.join(OUTPUT_DIR, `${config.name}.svg`);
      fs.writeFileSync(svgPath, svgContent);
      console.log(`   ✅ SVG: ${svgPath.replace(OUTPUT_DIR, '')}`);

      // Upload a Supabase (opzionale, se connesso)
      if (supabaseUrl && supabaseKey) {
        const pngUrl = await uploadToStorage(pngPath, pngBuffer, 'image/png');
        const svgUrl = await uploadToStorage(svgPath, Buffer.from(svgContent), 'image/svg+xml');
        
        if (pngUrl) console.log(`   ☁️  Upload PNG: ${pngUrl.substring(0, 60)}...`);
        if (svgUrl) console.log(`   ☁️  Upload SVG: ${svgUrl.substring(0, 60)}...`);
        
        results.push({ name: config.name, pngUrl, svgUrl });
      }

      console.log('');
    } catch (error) {
      console.error(`   ❌ Errore:`, error);
    }
  }

  // Genera index file
  console.log('📝 Generazione index...');
  const indexContent = generateIndexFile(ASSETS_CONFIG, results);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), indexContent);
  console.log('   ✅ index.json creato\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Generazione completata!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📁 Assets generati in:');
  console.log(`   ${OUTPUT_DIR}\n`);
  console.log(`📊 Totale: ${ASSETS_CONFIG.length * 2} file (+ index)`);
}

function generateIndexFile(configs: AssetConfig[], results: any[]): string {
  const index = {
    generatedAt: new Date().toISOString(),
    assets: configs.map((config, i) => ({
      id: config.name,
      type: config.type,
      dimensions: { width: config.width, height: config.height },
      description: config.description,
      files: {
        png: `${config.name}.png`,
        svg: `${config.name}.svg`,
        ...(results[i]?.pngUrl && { pngUrl: results[i].pngUrl }),
        ...(results[i]?.svgUrl && { svgUrl: results[i].svgUrl })
      }
    }))
  };
  
  return JSON.stringify(index, null, 2);
}

// Run
main().catch(console.error);
