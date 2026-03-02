/**
 * Script: Setup Database Template System
 * Crea le tabelle necessarie per il sistema template Thumio-style
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from parent directory
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Errore: Variabili Supabase mancanti in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTemplateDatabase() {
  console.log('🗄️  Setup Database Template System\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Crea tabella templates
    console.log('📋 Creazione tabella templates...');
    const { error: templatesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          template_id VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          category VARCHAR(50) NOT NULL CHECK (category IN ('IWP', 'IWA', 'UNIVERSAL')),
          type VARCHAR(50) NOT NULL,
          dimensions JSONB NOT NULL DEFAULT '{"width": 1080, "height": 1080, "format": "square"}',
          layers JSONB NOT NULL DEFAULT '[]',
          customization JSONB NOT NULL DEFAULT '{}',
          base_assets JSONB NOT NULL DEFAULT '{}',
          ai_prompts JSONB NOT NULL DEFAULT '{}',
          base_image_url TEXT,
          demo_figure_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (templatesError) {
      // Try direct SQL if RPC fails
      const { error: directError } = await supabase.from('templates').select('count').limit(1);
      if (directError && directError.code === '42P01') {
        console.log('   ℹ️  Creazione tabella via query diretta...');
        // Table doesn't exist, will be created by schema SQL
      } else {
        console.log('   ✅ Tabella templates esiste già');
      }
    } else {
      console.log('   ✅ Tabella templates creata');
    }

    // 2. Crea tabella template_categories
    console.log('📁 Creazione tabella template_categories...');
    const { error: catError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS template_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          icon VARCHAR(50),
          sort_order INTEGER DEFAULT 0
        );
      `
    });

    if (catError) {
      console.log('   ℹ️  Categorie potrebbero già esistere');
    } else {
      console.log('   ✅ Tabella template_categories creata');
    }

    // 3. Crea tabella user_template_instances
    console.log('👤 Creazione tabella user_template_instances...');
    const { error: instancesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_template_instances (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          template_id VARCHAR(100) NOT NULL REFERENCES templates(template_id),
          custom_data JSONB NOT NULL DEFAULT '{}',
          uploaded_images JSONB NOT NULL DEFAULT '[]',
          final_image_url TEXT,
          status VARCHAR(50) DEFAULT 'draft',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (instancesError) {
      console.log('   ℹ️  Istanze utente potrebbero già esistere');
    } else {
      console.log('   ✅ Tabella user_template_instances creata');
    }

    // 4. Inserisci categorie
    console.log('\n📑 Inserimento categorie...');
    const categories = [
      { slug: 'iwp-podcast', name: 'IWP Podcast', description: 'Template per episodi podcast e interviste', icon: 'mic', sort_order: 1 },
      { slug: 'iwp-events', name: 'IWP Eventi', description: 'Template per eventi, fiere e masterclass', icon: 'calendar', sort_order: 2 },
      { slug: 'iwp-promo', name: 'IWP Promozionali', description: 'Template promozionali e marketing', icon: 'megaphone', sort_order: 3 },
      { slug: 'iwa-courses', name: 'IWA Corsi WSET', description: 'Template per corsi WSET e formazione', icon: 'graduation-cap', sort_order: 4 },
      { slug: 'iwa-educational', name: 'IWA Educational', description: 'Contenuti educativi e infografiche', icon: 'book-open', sort_order: 5 },
      { slug: 'universal', name: 'Template Universali', description: 'Stili minimal adatti ad entrambi i brand', icon: 'layout', sort_order: 6 },
    ];

    const { error: upsertCatError } = await supabase
      .from('template_categories')
      .upsert(categories, { onConflict: 'slug' });

    if (upsertCatError) {
      console.error('   ❌ Errore categorie:', upsertCatError.message);
    } else {
      console.log(`   ✅ ${categories.length} categorie inserite`);
    }

    // 5. Inserisci template iniziali
    console.log('\n🎨 Inserimento template iniziali...');
    
    const templates = [
      // IWP Templates
      {
        template_id: 'iwp-ambassador-circle',
        name: "Ambassador's Corner",
        category: 'IWP',
        type: 'podcast',
        dimensions: { width: 1080, height: 1080, format: 'square' },
        layers: [
          { id: 'bg', type: 'shape', name: 'Background', zIndex: 0, editable: false, position: { x: 0, y: 0 }, size: { width: 1080, height: 1080 } },
          { id: 'photo-circle', type: 'image', name: 'Foto Ospite', zIndex: 1, editable: true, position: { x: 290, y: 200 }, size: { width: 500, height: 500 }, config: { mask: 'circle', allowUpload: true, aiProcessing: 'full' } },
          { id: 'title-arch', type: 'text', name: 'Titolo', zIndex: 2, editable: true, position: { x: 100, y: 50 }, config: { defaultText: "AMBASSADOR'S CORNER", fontFamily: 'Playfair Display', fontSize: 48, color: '#FFFFFF', alignment: 'center' } },
          { id: 'controls', type: 'overlay', name: 'Player Controls', zIndex: 3, editable: false },
          { id: 'guest-name', type: 'text', name: 'Nome Ospite', zIndex: 4, editable: true, position: { x: 100, y: 900 }, config: { defaultText: 'Nome Ospite', fontFamily: 'Inter', fontSize: 32, color: '#FFFFFF', alignment: 'center' } }
        ],
        base_assets: {
          background: '/templates/bases/iwp-ambassador-circle-base.png',
          demoFigure: '/templates/assets/demo-figure-circle.svg',
          fonts: ['Playfair Display', 'Inter']
        },
        ai_prompts: {
          gemini: 'Create a podcast template with burgundy red background (#8B2635), white circle in center for photo, curved text at top, podcast player controls at bottom',
          openAI: 'Remove background from user photo, apply professional wine industry style, optimize for circular mask'
        }
      },
      {
        template_id: 'iwp-masterclass-duo',
        name: 'Masterclass Duo',
        category: 'IWP',
        type: 'event',
        dimensions: { width: 1080, height: 1080, format: 'square' },
        layers: [
          { id: 'bg', type: 'shape', name: 'Background', zIndex: 0, editable: false },
          { id: 'photo-left', type: 'image', name: 'Speaker 1', zIndex: 1, editable: true, position: { x: 150, y: 200 }, size: { width: 350, height: 450 }, config: { mask: 'rounded', allowUpload: true } },
          { id: 'photo-right', type: 'image', name: 'Speaker 2', zIndex: 2, editable: true, position: { x: 580, y: 200 }, size: { width: 350, height: 450 }, config: { mask: 'rounded', allowUpload: true } },
          { id: 'title', type: 'text', name: 'Titolo Masterclass', zIndex: 3, editable: true, position: { x: 100, y: 700 }, config: { defaultText: 'MASTERCLASS', fontFamily: 'Playfair Display', fontSize: 64, color: '#FFFFFF', alignment: 'center' } },
          { id: 'subtitle', type: 'text', name: 'Sottotitolo', zIndex: 4, editable: true, position: { x: 100, y: 800 }, config: { defaultText: 'con Nome Relatori', fontFamily: 'Inter', fontSize: 28, color: '#FFFFFF', alignment: 'center' } }
        ],
        base_assets: {
          background: '/templates/bases/iwp-masterclass-duo-base.png',
          demoFigure: '/templates/assets/demo-figure-duo.svg',
          fonts: ['Playfair Display', 'Inter']
        },
        ai_prompts: {
          gemini: 'Create event template with bold red background, space for two speaker photos side by side, professional typography',
          openAI: 'Process two speaker photos with background removal and professional styling'
        }
      },
      // IWA Templates
      {
        template_id: 'iwa-wset-level1',
        name: 'WSET Level 1',
        category: 'IWA',
        type: 'course',
        dimensions: { width: 1080, height: 1350, format: 'portrait' },
        layers: [
          { id: 'bg', type: 'shape', name: 'Background', zIndex: 0, editable: false },
          { id: 'header-banner', type: 'overlay', name: 'Header', zIndex: 1, editable: false },
          { id: 'title', type: 'text', name: 'Titolo Corso', zIndex: 2, editable: true, position: { x: 100, y: 100 }, config: { defaultText: 'WSET LEVEL 1', fontFamily: 'Cinzel', fontSize: 56, color: '#FFFFFF', alignment: 'center' } },
          { id: 'date', type: 'text', name: 'Data', zIndex: 3, editable: true, position: { x: 150, y: 350 }, config: { defaultText: '6 March 2026', fontFamily: 'Inter', fontSize: 32, color: '#2D3748', alignment: 'left' } },
          { id: 'location', type: 'text', name: 'Location', zIndex: 4, editable: true, position: { x: 150, y: 420 }, config: { defaultText: 'Italian Wine Academy, Verona', fontFamily: 'Inter', fontSize: 28, color: '#2D3748', alignment: 'left' } },
          { id: 'educator', type: 'text', name: 'Educator', zIndex: 5, editable: true, position: { x: 150, y: 490 }, config: { defaultText: 'Cynthia Chaplin', fontFamily: 'Inter', fontSize: 28, color: '#2D3748', alignment: 'left' } },
          { id: 'illustration', type: 'overlay', name: 'Illustrazione', zIndex: 6, editable: false }
        ],
        base_assets: {
          background: '/templates/bases/iwa-wset-level1-base.png',
          demoFigure: '/templates/assets/demo-figure-portrait.svg',
          fonts: ['Cinzel', 'Inter']
        },
        ai_prompts: {
          gemini: 'Create course infographic with cream background, orange header banner, calendar and location icons, line art illustrations of wine hands',
          openAI: 'Minimal processing for course graphics'
        }
      },
      // Universal Templates (Thumio-style)
      {
        template_id: 'thm-minimal-bordeaux',
        name: 'Minimal Bordeaux',
        category: 'UNIVERSAL',
        type: 'portrait',
        dimensions: { width: 1080, height: 1350, format: 'portrait' },
        layers: [
          { id: 'bg', type: 'shape', name: 'Background', zIndex: 0, editable: true, config: { defaultColor: '#F5F5F0' } },
          { id: 'figure', type: 'image', name: 'Figura Principale', zIndex: 1, editable: true, position: { x: 340, y: 300 }, size: { width: 400, height: 600 }, config: { mask: 'none', allowUpload: true, aiProcessing: 'full' } },
          { id: 'wine-hand-left', type: 'overlay', name: 'Mano Vino Sinistra', zIndex: 2, editable: false },
          { id: 'wine-hand-right', type: 'overlay', name: 'Mano Vino Destra', zIndex: 3, editable: false },
          { id: 'caption', type: 'text', name: 'Caption', zIndex: 4, editable: true, position: { x: 100, y: 1200 }, config: { defaultText: 'Cin Cin!', fontFamily: 'Playfair Display', fontSize: 48, color: '#1A1A1A', alignment: 'center' } }
        ],
        base_assets: {
          background: '/templates/bases/thm-minimal-bordeaux-base.png',
          demoFigure: '/templates/assets/demo-figure-portrait.svg',
          fonts: ['Playfair Display']
        },
        ai_prompts: {
          gemini: 'Create minimalist template with warm cream background, line art wine hands from corners, central silhouette placeholder for portrait photo',
          openAI: 'Professional background removal and warm tone styling for portrait'
        }
      },
      {
        template_id: 'thm-line-art-toast',
        name: 'Line Art Toast',
        category: 'UNIVERSAL',
        type: 'quote',
        dimensions: { width: 1080, height: 1350, format: 'portrait' },
        layers: [
          { id: 'bg', type: 'shape', name: 'Background', zIndex: 0, editable: true, config: { defaultColor: '#FAFAFA' } },
          { id: 'line-art', type: 'overlay', name: 'Line Art', zIndex: 1, editable: false },
          { id: 'quote', type: 'text', name: 'Citazione', zIndex: 2, editable: true, position: { x: 100, y: 500 }, size: { width: 880, height: 400 }, config: { defaultText: '"Wine is the poetry of the earth."', fontFamily: 'Playfair Display', fontSize: 42, color: '#1A1A1A', alignment: 'center' } },
          { id: 'author', type: 'text', name: 'Autore', zIndex: 3, editable: true, position: { x: 100, y: 950 }, config: { defaultText: '- Mario Soldati', fontFamily: 'Inter', fontSize: 24, color: '#666666', alignment: 'center' } }
        ],
        base_assets: {
          background: '/templates/bases/thm-line-art-toast-base.png',
          demoFigure: null,
          fonts: ['Playfair Display', 'Inter']
        },
        ai_prompts: {
          gemini: 'Elegant quote template with minimal line art hands toasting with wine glasses, generous whitespace',
          openAI: 'Not applicable for text-only template'
        }
      }
    ];

    const { error: upsertTemplateError } = await supabase
      .from('templates')
      .upsert(templates, { onConflict: 'template_id' });

    if (upsertTemplateError) {
      console.error('   ❌ Errore template:', upsertTemplateError.message);
    } else {
      console.log(`   ✅ ${templates.length} template inseriti`);
    }

    // 6. Crea bucket storage se non esiste
    console.log('\n📦 Verifica storage buckets...');
    
    const buckets = ['template-assets', 'social-images', 'user-uploads'];
    for (const bucket of buckets) {
      const { error: bucketError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
      });
      
      if (bucketError) {
        if (bucketError.message.includes('already exists')) {
          console.log(`   ✅ Bucket ${bucket} esiste`);
        } else {
          console.error(`   ⚠️  Errore bucket ${bucket}:`, bucketError.message);
        }
      } else {
        console.log(`   ✅ Bucket ${bucket} creato`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Setup completato con successo!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Stampa riepilogo
    const { data: templateCount } = await supabase.from('templates').select('id', { count: 'exact' });
    const { data: categoryCount } = await supabase.from('template_categories').select('id', { count: 'exact' });
    
    console.log('📊 Riepilogo:');
    console.log(`   • Template: ${templateCount?.length || 0}`);
    console.log(`   • Categorie: ${categoryCount?.length || 0}`);
    console.log(`   • Storage buckets: ${buckets.length}\n`);

  } catch (error) {
    console.error('\n❌ Errore durante setup:', error);
    process.exit(1);
  }
}

// Esegui
setupTemplateDatabase();
