/**
 * Script: Generazione Template Base con Gemini
 * Crea gli sfondi e layout di base per i template
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!GOOGLE_API_KEY) {
  console.error('❌ Errore: GOOGLE_AI_API_KEY mancante in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const supabase = createClient(supabaseUrl, supabaseKey);

// Output directory
const OUTPUT_DIR = path.resolve(__dirname, '../public/templates/bases');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TemplateGenerationJob {
  templateId: string;
  name: string;
  description: string;
  prompt: string;
  width: number;
  height: number;
  format: 'png' | 'jpeg';
}

const TEMPLATE_JOBS: TemplateGenerationJob[] = [
  {
    templateId: 'iwp-ambassador-circle',
    name: "Ambassador's Corner",
    description: 'Template podcast con cerchio centrale per foto ospite',
    width: 1080,
    height: 1080,
    format: 'png',
    prompt: `Create a professional podcast social media template.

Visual specifications:
- Background: Deep burgundy red (#8B2635) with subtle paper texture
- Center: Large pure white circle (550px diameter) for guest photo placement
- Top: Curved/arch text area with "AMBASSADOR'S CORNER" in elegant white serif typography
- Bottom: Podcast player control bar (play, pause, skip buttons) in semi-transparent white
- Below controls: Thin decorative line and space for guest name
- Top-left corner: Small circular placeholder for logo

Style: Professional, elegant, wine industry podcast aesthetic. High contrast, clean design suitable for Instagram posts.

Important: The central white circle must be perfectly centered and completely empty (no photo inside) - this is a placeholder for user-uploaded images.`
  },
  {
    templateId: 'iwp-masterclass-duo',
    name: 'Masterclass Duo',
    description: 'Template evento con due speaker',
    width: 1080,
    height: 1080,
    format: 'png',
    prompt: `Create an event promotional template for a wine masterclass.

Visual specifications:
- Background: Bold red (#B91C1C) with slight gradient to darker at bottom
- Layout: Two rectangular photo areas side by side (left and right)
- Photo areas: Rounded corners, 350x450px each, positioned at 150px and 580px from left, 200px from top
- Space between photos: 80px
- Center bottom: Large bold title "MASTERCLASS" in white Playfair Display serif font (64px)
- Below title: Subtitle space "with Guest Speakers" in lighter weight
- Top: Small banner area for event date
- Decorative elements: Subtle geometric wine-related icons

Style: Professional, authoritative, suitable for educational wine events. Bold typography, clean layout.

Important: Photo areas must show placeholder gray (#E0E0E0) or subtle silhouette pattern - these will be replaced with speaker photos.`
  },
  {
    templateId: 'iwa-wset-level1',
    name: 'WSET Level 1',
    description: 'Infografica corso WSET',
    width: 1080,
    height: 1350,
    format: 'jpeg',
    prompt: `Create an educational course infographic for WSET wine certification.

Visual specifications:
- Background: Warm cream (#FFF8F0) with subtle paper texture
- Header: Orange banner (#F4A261) with irregular/scalloped bottom edge, spanning full width
- Header text: "WSET LEVEL 1" in bold white sans-serif, centered
- Logo area: Top-right corner, circular blue badge placeholder for IWA logo
- Content sections with icons:
  * Calendar icon + "6 March 2026" in dark gray
  * Location pin icon + "Italian Wine Academy, Verona" 
  * Educator icon + "Cynthia Chaplin"
  * Exam info section
- Illustrations: 
  * Top-left: Line art hand holding champagne flute (black lines)
  * Bottom-right: Stylized figure holding wine glass (orange/blue accent colors)
- Typography: Mix of serif headers and clean sans-serif body text

Style: Academic yet approachable, professional wine education aesthetic. Clean hierarchy, informative layout suitable for course announcements.

Important: Include placeholder silhouettes or empty spaces where photos/illustrations would go.`
  },
  {
    templateId: 'thm-minimal-bordeaux',
    name: 'Minimal Bordeaux',
    description: 'Template minimalista Thumio-style',
    width: 1080,
    height: 1350,
    format: 'png',
    prompt: `Create a minimalist editorial-style wine template inspired by Thumio/Fashion magazines.

Visual specifications:
- Background: Warm off-white (#F5F5F0) with very subtle paper texture
- Illustrations (black line art, 2px stroke):
  * Top-left corner: Arm entering frame holding wine glass with red wine
  * Bottom-right corner: Hand holding champagne flute
  * Style: Elegant, minimal line drawings
- Center: Large vertical oval area (400x600px) with subtle dashed outline indicating photo placement area
- Center placeholder: Dark gray (#333333) silhouette or empty space for portrait photo
- Bottom: "Cin Cin!" text in elegant serif, small and refined
- Overall: Very generous negative space, editorial/fashion magazine aesthetic

Style: Extremely minimal, high-end editorial, sophisticated. Inspired by luxury wine brand advertisements and fashion photography layouts.

Important: The central area must clearly indicate where a portrait photo will be placed - use placeholder outline or subtle silhouette.`
  },
  {
    templateId: 'thm-line-art-toast',
    name: 'Line Art Toast',
    description: 'Template citazione con brindisi',
    width: 1080,
    height: 1350,
    format: 'png',
    prompt: `Create an elegant quote template with wine toasting theme.

Visual specifications:
- Background: Pure white (#FFFFFF) or very light cream
- Line art illustration (black, 1.5px stroke):
  * Two hands entering from opposite sides, toasting with wine glasses
  * Positioned in upper third of image
  * Style: Minimal, elegant, continuous line drawing style
- Quote area: Center of image, generous padding
  * Large quotation mark graphic at top
  * Text: "Wine is the poetry of the earth" placeholder in elegant serif
- Author line: Below quote, smaller italic text "- Author Name"
- Bottom: Small decorative wine-related icon or vine element

Style: Literary, elegant, perfect for wine quotes and philosophical content. Instagram-worthy aesthetic with lots of whitespace.

Important: No photo placeholders needed - this is text-focused template.`
  }
];

/**
 * Genera immagine con Gemini
 */
async function generateWithGemini(job: TemplateGenerationJob): Promise<Buffer | null> {
  console.log(`   🤖 Chiamata Gemini API...`);
  
  try {
    // Usa modello con supporto immagini
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: job.prompt }] }],
      generationConfig: {
        temperature: 0.4
      }
    });

    const response = await result.response;
    
    // Estrai l'immagine dalla risposta
    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: any) => part.inlineData);
    
    if (!imagePart?.inlineData?.data) {
      console.log(`   ⚠️  Nessuna immagine nella risposta, testo ricevuto:`);
      const textPart = parts.find((part: any) => part.text);
      console.log(`      ${textPart?.text?.substring(0, 100) || 'N/A'}...`);
      return null;
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    console.log(`   ✅ Immagine generata: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
    
    return imageBuffer;

  } catch (error: any) {
    console.error(`   ❌ Errore Gemini:`, error.message);
    if (error.message?.includes('API key')) {
      console.error(`      Verifica che GOOGLE_AI_API_KEY sia valida`);
    }
    return null;
  }
}

/**
 * Upload a Supabase Storage
 */
async function uploadToStorage(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  const storagePath = `bases/${fileName}`;
  
  const { error } = await supabase.storage
    .from('template-assets')
    .upload(storagePath, buffer, {
      contentType,
      upsert: true
    });
  
  if (error) {
    console.error(`      ❌ Errore upload:`, error.message);
    return null;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('template-assets')
    .getPublicUrl(storagePath);
  
  return publicUrl;
}

/**
 * Main
 */
async function main() {
  console.log('🎨 Generazione Template Base con Gemini\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results: any[] = [];

  for (const job of TEMPLATE_JOBS) {
    console.log(`📐 ${job.name}`);
    console.log(`   ID: ${job.templateId}`);
    console.log(`   Dimensioni: ${job.width}x${job.height} (${job.format})`);
    console.log(`   ${job.description}`);

    // Genera con Gemini
    const imageBuffer = await generateWithGemini(job);
    
    if (!imageBuffer) {
      console.log(`   ⏭️  Saltato\n`);
      continue;
    }

    // Salva localmente
    const fileName = `${job.templateId}-base.${job.format}`;
    const localPath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(localPath, imageBuffer);
    console.log(`   💾 Salvato: ${localPath.replace(OUTPUT_DIR, '')}`);

    // Upload a Supabase
    let publicUrl: string | null = null;
    if (supabaseUrl && supabaseKey) {
      publicUrl = await uploadToStorage(
        fileName,
        imageBuffer,
        `image/${job.format}`
      );
      
      if (publicUrl) {
        console.log(`   ☁️  URL: ${publicUrl.substring(0, 60)}...`);
        
        // Aggiorna database
        const { error: updateError } = await supabase
          .from('templates')
          .update({ base_image_url: publicUrl })
          .eq('template_id', job.templateId);
        
        if (updateError) {
          console.log(`   ⚠️  Errore update DB: ${updateError.message}`);
        } else {
          console.log(`   🗄️  Database aggiornato`);
        }
      }
    }

    results.push({
      templateId: job.templateId,
      name: job.name,
      localPath,
      publicUrl,
      size: imageBuffer.length
    });

    console.log('');
    
    // Rate limiting - attesa tra chiamate
    if (job !== TEMPLATE_JOBS[TEMPLATE_JOBS.length - 1]) {
      console.log('   ⏳ Attesa 3s per rate limiting...');
      await new Promise(r => setTimeout(r, 3000));
      console.log('');
    }
  }

  // Salva report
  const reportPath = path.join(OUTPUT_DIR, 'generation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    total: TEMPLATE_JOBS.length,
    successful: results.length,
    results
  }, null, 2));

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Generazione completata!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`📊 Riepilogo:`);
  console.log(`   Template richiesti: ${TEMPLATE_JOBS.length}`);
  console.log(`   Generati con successo: ${results.length}`);
  console.log(`   Dimensione totale: ${(results.reduce((a, r) => a + r.size, 0) / 1024 / 1024).toFixed(2)} MB\n`);
  
  console.log(`📁 Files in: ${OUTPUT_DIR}`);
  console.log(`📝 Report: ${reportPath}`);
}

// Run
main().catch(console.error);
