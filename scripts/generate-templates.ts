/**
 * Script: generate-templates.ts
 * Genera le immagini base dei 30 template usando Gemini Pro Image + silhouette overlay
 * Poi le carica su Supabase Storage e aggiorna il DB.
 *
 * Utilizzo:
 *   npx tsx scripts/generate-templates.ts
 *   npx tsx scripts/generate-templates.ts --dry-run          # nessun upload, solo log
 *   npx tsx scripts/generate-templates.ts --template=iwp-ambassador-circle  # singolo
 *   npx tsx scripts/generate-templates.ts --category=IWP     # solo categoria
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carica .env.local (Next.js convention) con priorità su .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });
import { createClient } from '@supabase/supabase-js';
import { createCanvas, loadImage, Image as CanvasImage } from 'canvas';
import * as fs from 'fs';

// ─── Config ───────────────────────────────────────────────────────────────────

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'social-images';

const GEMINI_IMAGE_MODEL = process.env.GEMINI_PRO_IMAGE_MODEL || 'gemini-2.5-flash-image';

const ASSETS_DIR = path.join(process.cwd(), 'public', 'templates', 'assets');
const BASES_DIR = path.join(process.cwd(), 'public', 'templates', 'bases');

// ─── Template definitions ─────────────────────────────────────────────────────

interface TemplateConfig {
  template_id: string;
  name: string;
  category: 'IWP' | 'IWA' | 'UNIVERSAL';
  dimensions: { width: number; height: number };
  demoFigure: string | null; // path relativo a /public
  geminiPrompt: string;
}

const TEMPLATES: TemplateConfig[] = [
  // IWP
  { template_id: 'iwp-ambassador-circle', name: "Ambassador's Corner", category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: '/templates/assets/demo-figure-circle.png', geminiPrompt: 'Create a professional Instagram post background for Italian Wine Podcast. Deep wine red #8B2635 background, large white circle in center (600px), elegant typography zones at top and bottom, modern podcast cover aesthetic, no text, clean composition.' },
  { template_id: 'iwp-masterclass-duo', name: 'Masterclass Duo', category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: '/templates/assets/demo-figure-duo.png', geminiPrompt: 'Professional wine masterclass Instagram post background. Bold wine red #7B2D4E, split composition for two speakers side by side, geometric framing elements, IWP Italian Wine Podcast branding style, no text, clean editorial design.' },
  { template_id: 'iwp-unplugged-book', name: 'Unplugged Book', category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'Wine podcast book-style Instagram template background. Cream #FAF6F0 base with wine red #8B2635 accent lines, vertical list area on left side for wine varieties, elegant serif typography zones, podcast aesthetic, no text.' },
  { template_id: 'iwp-slow-wine', name: 'Slow Wine Event', category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: '/templates/assets/demo-figure-circle.png', geminiPrompt: 'Slow Wine event Instagram post background template. Wine red and dark background, podcast player bar element at bottom, circular frame in center, sophisticated urban aesthetic, no text, clean design.' },
  { template_id: 'iwp-wine2wine', name: 'Wine2Wine Forum', category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: '/templates/assets/demo-figure-bust.png', geminiPrompt: 'Wine2Wine international wine business forum Instagram template. Dark corporate background with stage/spotlight element, professional conference aesthetic, wine industry branding, golden accent lines, no text.' },
  { template_id: 'iwp-quote-story', name: 'Quote Story', category: 'IWP', dimensions: { width: 1080, height: 1920 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'Vertical Instagram Story template for wine quote. Blurred vineyard/winery background with 60% dark overlay, centered quote zone with white frame, elegant editorial style, no text, 1080x1920 format.' },
  { template_id: 'iwp-on-the-road', name: 'On The Road', category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: '/templates/assets/demo-figure-square.png', geminiPrompt: 'Wine travel vlog collage Instagram template. 4-panel grid layout with white borders, travel reportage aesthetic, warm tones, space for photos, authentic and dynamic, no text.' },
  { template_id: 'iwp-wine-geeks', name: 'Wine Geeks Data', category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: null, geminiPrompt: 'Wine data analytics Instagram infographic template background. Red and white color scheme, chart/graph placeholder areas, bold typography zones for statistics, analytical and modern design, no text, clean grid.' },
  { template_id: 'iwp-cin-cin', name: 'Cin Cin Community', category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: '/templates/assets/demo-figure-duo.png', geminiPrompt: 'Wine community celebration Instagram template. Warm festive tones, champagne bubbles elements, celebration design with space for two people, IWP wine brand colors, joyful and engaging, no text.' },
  { template_id: 'iwp-new-discovery', name: 'New Discovery', category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: null, geminiPrompt: 'Wine bottle discovery reveal Instagram template. Dark elegant background with golden spotlight circle in center for product placement, luxury editorial aesthetic, wine brand discovery reveal design, no text.' },
  { template_id: 'iwp-behind-scenes', name: 'Behind The Scenes', category: 'IWP', dimensions: { width: 1080, height: 1080 }, demoFigure: '/templates/assets/demo-figure-square.png', geminiPrompt: 'Wine behind the scenes Instagram template. Raw authentic aesthetic, slight film grain texture, desaturated warm tones, backstage/winery mood, candid photography style frame, no text.' },
  { template_id: 'iwp-via-academy', name: 'VIA Academy', category: 'IWP', dimensions: { width: 1080, height: 1350 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'VIA Italian Wine Academy institutional Instagram template portrait. Official wine academy aesthetic, cream and wine red #7B2D4E, elegant serif typography zones, credential/certification design, professional and authoritative, no text.' },

  // IWA
  { template_id: 'iwa-wset-level1', name: 'WSET Level 1', category: 'IWA', dimensions: { width: 1080, height: 1350 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'WSET Level 1 wine education Instagram portrait template. Cream #FAF6F0 and warm orange #C8956C color scheme, structured infographic sections at bottom, IWA Italian Wine Academy branding, professional certification design, no text.' },
  { template_id: 'iwa-wset-level2', name: 'WSET Level 2', category: 'IWA', dimensions: { width: 1080, height: 1350 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'WSET Level 2 wine course Instagram portrait template. Navy blue #004A8F primary color, structured advanced infographic layout, wine education certification aesthetic, IWA academy branding, professional, no text.' },
  { template_id: 'iwa-wset-level3', name: 'WSET Level 3', category: 'IWA', dimensions: { width: 1080, height: 1350 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'WSET Level 3 premium wine qualification Instagram portrait template. Forest green #007749, sophisticated premium design, tasting notes grid section, top sommelier aesthetic, IWA branding, no text.' },
  { template_id: 'iwa-champagne-spec', name: 'Champagne Specialist', category: 'IWA', dimensions: { width: 1080, height: 1350 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'Champagne Specialist wine course Instagram portrait template. Cream and gold #D4AF37 color palette, luxury minimalism, subtle champagne bubbles, elegant typography zones, high-end wine education aesthetic, no text.' },
  { template_id: 'iwa-grape-deep-dive', name: 'Grape Deep Dive', category: 'IWA', dimensions: { width: 1080, height: 1350 }, demoFigure: null, geminiPrompt: 'Wine grape variety deep dive educational Instagram portrait template. Botanical illustration style with grape leaves and cluster in background, green and burgundy palette, scientific elegant design, educational zones, no text.' },
  { template_id: 'iwa-region-focus', name: 'Region Focus', category: 'IWA', dimensions: { width: 1080, height: 1350 }, demoFigure: null, geminiPrompt: 'Wine region focus educational Instagram portrait template. Stylized geographic map in background, topographic contour lines, cartographic warm palette, elegant wine region illustration, educational design, no text.' },
  { template_id: 'iwa-wine-food', name: 'Wine & Food Pairing', category: 'IWA', dimensions: { width: 1080, height: 1080 }, demoFigure: null, geminiPrompt: 'Wine and food pairing educational Instagram square template. Split composition: wine glass left, food plate right, stylized connection lines between them, appetizing warm palette, elegant educational design, no text.' },
  { template_id: 'iwa-study-tips', name: 'Study Tips', category: 'IWA', dimensions: { width: 1080, height: 1350 }, demoFigure: null, geminiPrompt: 'Wine study tips checklist Instagram portrait template. IWA purple #5C2D91 and gold #D4AF37, minimal icon placeholders in list format, organized educational layout, clean typography zones, no text.' },
  { template_id: 'iwa-wine-career', name: 'Wine Career Path', category: 'IWA', dimensions: { width: 1080, height: 1350 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'Wine career path timeline Instagram portrait template. Vertical career progression design, milestone markers, upward arrow elements, IWA purple and gold colors, professional aspirational design, no text.' },
  { template_id: 'iwa-sustainability', name: 'Sustainability in Wine', category: 'IWA', dimensions: { width: 1080, height: 1350 }, demoFigure: null, geminiPrompt: 'Wine sustainability Instagram portrait template. Eco green #2D6A4F primary color, circular ecosystem design with leaf/earth/water icon placeholders, environmental wine production, clean and eco-conscious aesthetic, no text.' },

  // Universal Thumio-Style
  { template_id: 'thm-minimal-bordeaux', name: 'Minimal Bordeaux', category: 'UNIVERSAL', dimensions: { width: 1080, height: 1350 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'Thumio-style minimal wine Instagram portrait template. Off-white #F5F0EB background, elegant line art hands holding wine glass in corner, generous negative space in center for person photo, minimal typography zones, Bordeaux wine aesthetic, no text.' },
  { template_id: 'thm-line-art-toast', name: 'Line Art Toast', category: 'UNIVERSAL', dimensions: { width: 1080, height: 1350 }, demoFigure: null, geminiPrompt: 'Thumio-style wine toast line art Instagram portrait template. Clean white background, minimal line art illustration of two hands toasting wine glasses, large quote space in center, elegant illustrative style, no text.' },
  { template_id: 'thm-wine-glass-portrait', name: 'Wine Glass Portrait', category: 'UNIVERSAL', dimensions: { width: 1080, height: 1350 }, demoFigure: '/templates/assets/demo-figure-portrait.png', geminiPrompt: 'Luxury wine glass portrait Instagram template. Large oversized wine glass silhouette in background, deep red to purple gradient, space for person photo through the glass, editorial luxury aesthetic, no text.' },
  { template_id: 'thm-abstract-wine', name: 'Abstract Wine', category: 'UNIVERSAL', dimensions: { width: 1080, height: 1080 }, demoFigure: null, geminiPrompt: 'Abstract wine Instagram square template. Dynamic red and purple paint splash composition inspired by wine pouring, dark background, contemporary art aesthetic, visually striking, no text.' },
  { template_id: 'thm-classic-cheers', name: 'Classic Cheers', category: 'UNIVERSAL', dimensions: { width: 1080, height: 1080 }, demoFigure: '/templates/assets/demo-figure-duo.png', geminiPrompt: 'Classic wine cheers celebration Instagram square template. Two raised wine glasses in foreground with bokeh winery background, warm golden sunset light, elegant celebration mood, space for two people, no text.' },
  { template_id: 'thm-vineyard-view', name: 'Vineyard View', category: 'UNIVERSAL', dimensions: { width: 1080, height: 1350 }, demoFigure: '/templates/assets/demo-figure-bust.png', geminiPrompt: 'Vineyard landscape Instagram portrait template. Rolling vineyard rows in golden hour light, Tuscany or Burgundy landscape, space in foreground for person silhouette, warm pastoral mood, no text.' },
  { template_id: 'thm-cork-and-wine', name: 'Cork & Wine Minimal', category: 'UNIVERSAL', dimensions: { width: 1080, height: 1080 }, demoFigure: null, geminiPrompt: 'Minimal wine cork and bottle flatlay Instagram square template. White marble background, wine cork and partial bottle neck arranged minimally, subtle soft shadow, luxury product photography aesthetic, no text.' },
  { template_id: 'thm-terroir-map', name: 'Terroir Map', category: 'UNIVERSAL', dimensions: { width: 1080, height: 1350 }, demoFigure: null, geminiPrompt: 'Wine terroir geographic map Instagram portrait template. Stylized topographic contour map of wine region, warm parchment tones, denomination zone markers, elegant cartographic illustration, educational wine geography, no text.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateWithGemini(prompt: string, width: number, height: number): Promise<Buffer | null> {
  if (!GOOGLE_AI_API_KEY) {
    console.error('[Gemini] GOOGLE_AI_API_KEY not set');
    return null;
  }

  const sizeHint = `${width}x${height} pixels, high resolution`;
  const fullPrompt = `${prompt} Image size: ${sizeHint}. Professional social media template quality.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Gemini] API error ${response.status}:`, err);
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }

    console.error('[Gemini] No image in response');
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('[Gemini] Request timed out');
    } else {
      console.error('[Gemini] Request failed:', err);
    }
    return null;
  }
}

async function overlayDemoFigure(
  baseImageBuffer: Buffer,
  demoFigurePath: string,
  width: number,
  height: number
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw base image
  const baseImg = await loadImage(baseImageBuffer);
  ctx.drawImage(baseImg, 0, 0, width, height);

  // Load and draw silhouette
  const figurePath = path.join(process.cwd(), 'public', demoFigurePath.replace(/^\//, ''));
  if (fs.existsSync(figurePath)) {
    const figureImg = await loadImage(figurePath);
    // Center the figure, scale to 40% of width
    const figW = width * 0.4;
    const figH = (figureImg.height / figureImg.width) * figW;
    const figX = (width - figW) / 2;
    const figY = (height - figH) / 2;
    ctx.globalAlpha = 0.85;
    ctx.drawImage(figureImg, figX, figY, figW, figH);
    ctx.globalAlpha = 1.0;
  } else {
    console.warn(`[Overlay] Demo figure not found: ${figurePath}`);
  }

  return canvas.toBuffer('image/png');
}

async function uploadToSupabase(
  buffer: Buffer,
  templateId: string,
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  const filePath = `templates/bases/${templateId}.png`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error(`[Upload] Failed to upload ${templateId}:`, error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

async function updateTemplateUrl(
  templateId: string,
  baseImageUrl: string,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('templates')
    .update({ base_image_url: baseImageUrl })
    .eq('template_id', templateId);

  if (error) {
    console.error(`[DB] Failed to update ${templateId}:`, error.message);
  }
}

function saveLocalCopy(buffer: Buffer, templateId: string): void {
  if (!fs.existsSync(BASES_DIR)) {
    fs.mkdirSync(BASES_DIR, { recursive: true });
  }
  const filePath = path.join(BASES_DIR, `${templateId}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`[Local] Saved: ${filePath}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const singleTemplate = args.find(a => a.startsWith('--template='))?.split('=')[1];
  const categoryFilter = args.find(a => a.startsWith('--category='))?.split('=')[1];

  console.log('🍷 Template Base Image Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (isDryRun) console.log('🔍 DRY RUN — no uploads will be performed');
  if (singleTemplate) console.log(`🎯 Single template: ${singleTemplate}`);
  if (categoryFilter) console.log(`🏷️  Category filter: ${categoryFilter}`);
  console.log('');

  if (!GOOGLE_AI_API_KEY) {
    console.error('❌ GOOGLE_AI_API_KEY not set. Add it to .env.local');
    process.exit(1);
  }

  let supabase: ReturnType<typeof createClient> | null = null;
  if (!isDryRun) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('❌ Supabase credentials not set.');
      process.exit(1);
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  // Filter templates
  let templatesToProcess = TEMPLATES;
  if (singleTemplate) {
    templatesToProcess = TEMPLATES.filter(t => t.template_id === singleTemplate);
    if (templatesToProcess.length === 0) {
      console.error(`❌ Template not found: ${singleTemplate}`);
      process.exit(1);
    }
  } else if (categoryFilter) {
    templatesToProcess = TEMPLATES.filter(t => t.category === categoryFilter.toUpperCase());
  }

  console.log(`📋 Processing ${templatesToProcess.length} templates...\n`);

  const results = { success: 0, failed: 0, skipped: 0 };

  for (const template of templatesToProcess) {
    console.log(`\n🖼️  [${template.category}] ${template.name} (${template.template_id})`);
    console.log(`   Dimensions: ${template.dimensions.width}×${template.dimensions.height}px`);

    // Generate base image with Gemini
    console.log('   ⏳ Generating base image with Gemini...');
    const baseBuffer = await generateWithGemini(
      template.geminiPrompt,
      template.dimensions.width,
      template.dimensions.height
    );

    if (!baseBuffer) {
      console.error('   ❌ Gemini generation failed, skipping');
      results.failed++;
      continue;
    }

    console.log(`   ✅ Base image generated (${Math.round(baseBuffer.length / 1024)}KB)`);

    // Overlay demo figure if available
    let finalBuffer = baseBuffer;
    if (template.demoFigure) {
      console.log('   🎭 Overlaying demo silhouette...');
      try {
        finalBuffer = await overlayDemoFigure(
          baseBuffer,
          template.demoFigure,
          template.dimensions.width,
          template.dimensions.height
        );
        console.log('   ✅ Silhouette overlay applied');
      } catch (err) {
        console.warn('   ⚠️  Silhouette overlay failed, using base image:', err);
        finalBuffer = baseBuffer;
      }
    }

    // Save local copy
    saveLocalCopy(finalBuffer, template.template_id);

    if (isDryRun) {
      console.log('   🔍 [DRY RUN] Skipping Supabase upload');
      results.skipped++;
      continue;
    }

    // Upload to Supabase
    console.log('   ⬆️  Uploading to Supabase Storage...');
    const publicUrl = await uploadToSupabase(finalBuffer, template.template_id, supabase!);

    if (!publicUrl) {
      console.error('   ❌ Upload failed');
      results.failed++;
      continue;
    }

    console.log(`   ✅ Uploaded: ${publicUrl}`);

    // Update DB
    await updateTemplateUrl(template.template_id, publicUrl, supabase!);
    console.log('   ✅ Database updated');

    results.success++;

    // Rate limit: pausa tra generazioni
    if (templatesToProcess.indexOf(template) < templatesToProcess.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Results:');
  console.log(`   ✅ Success: ${results.success}`);
  console.log(`   ❌ Failed:  ${results.failed}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log('');

  if (results.success > 0) {
    console.log('🎉 Template bases generated! Run the app to see them in the gallery.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
