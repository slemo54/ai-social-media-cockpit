/**
 * API Route: /api/templates/[id]
 * Dettaglio singolo template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import type { Template } from '@/types/template';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Validate template ID format: lowercase alphanumeric and hyphens only
function isValidTemplateId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(id) && id.length <= 100;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!isValidTemplateId(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID format' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (supabase) {
      const { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('template_id', id)
        .single();

      if (!error && template) {
        return NextResponse.json({ template, source: 'database' });
      }
    }

    // Fallback to static
    const staticTemplate = getStaticTemplate(id);
    if (staticTemplate) {
      return NextResponse.json({ template: staticTemplate, source: 'static' });
    }

    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('[Template Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

function getStaticTemplate(id: string): Template | null {
  const templates: Record<string, Template> = {
    'iwp-ambassador-circle': {
      template_id: 'iwp-ambassador-circle',
      name: "Ambassador's Corner",
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1080, height: 1080, format: 'square' },
      layers: [
        { id: 'photo-circle', type: 'image', name: 'Foto Ospite', zIndex: 1, editable: true, position: { x: 290, y: 200 }, size: { width: 500, height: 500 }, config: { mask: 'circle', allowUpload: true, aiProcessing: 'full' } },
        { id: 'title-arch', type: 'text', name: 'Titolo', zIndex: 2, editable: true, config: { defaultText: "AMBASSADOR'S CORNER", fontFamily: 'Playfair Display', fontSize: 48, color: '#FFFFFF', alignment: 'center' as const } },
        { id: 'guest-name', type: 'text', name: 'Nome Ospite', zIndex: 4, editable: true, config: { defaultText: 'Nome Ospite', fontFamily: 'Inter', fontSize: 32, color: '#FFFFFF', alignment: 'center' as const } }
      ],
      base_assets: {
        background: '/templates/bases/iwp-ambassador-circle-base.png',
        demoFigure: '/templates/assets/demo-figure-circle.png'
      },
      ai_prompts: {
        gemini: 'Create podcast template with burgundy red background, white circle for photo',
        openAI: 'Remove background from user photo, apply professional wine style'
      }
    },
    'iwp-masterclass-duo': {
      template_id: 'iwp-masterclass-duo',
      name: 'Masterclass Duo',
      category: 'IWP',
      type: 'event',
      dimensions: { width: 1080, height: 1080, format: 'square' },
      layers: [
        { id: 'figure', type: 'image', name: 'Speaker', zIndex: 1, editable: true, position: { x: 140, y: 200 }, size: { width: 800, height: 500 }, config: { allowUpload: true, aiProcessing: 'bg-remove' } }
      ],
      base_assets: {
        background: '/templates/bases/iwp-masterclass-duo-base.png',
        demoFigure: '/templates/assets/demo-figure-duo.png'
      }
    },
    'iwa-wset-level1': {
      template_id: 'iwa-wset-level1',
      name: 'WSET Level 1',
      category: 'IWA',
      type: 'course',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      layers: [
        { id: 'figure', type: 'image', name: 'Figura', zIndex: 1, editable: true, position: { x: 340, y: 700 }, size: { width: 400, height: 500 }, config: { allowUpload: true, aiProcessing: 'none' } }
      ],
      base_assets: {
        background: '/templates/bases/iwa-wset-level1-base.png',
        demoFigure: '/templates/assets/demo-figure-portrait.png'
      }
    },
    'thm-minimal-bordeaux': {
      template_id: 'thm-minimal-bordeaux',
      name: 'Minimal Bordeaux',
      category: 'UNIVERSAL',
      type: 'portrait',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      layers: [
        { id: 'figure', type: 'image', name: 'Figura Principale', zIndex: 1, editable: true, position: { x: 340, y: 300 }, size: { width: 400, height: 600 }, config: { allowUpload: true, aiProcessing: 'full' } }
      ],
      base_assets: {
        background: '/templates/bases/thm-minimal-bordeaux-base.png',
        demoFigure: '/templates/assets/demo-figure-portrait.png'
      }
    },
    'thm-line-art-toast': {
      template_id: 'thm-line-art-toast',
      name: 'Line Art Toast',
      category: 'UNIVERSAL',
      type: 'quote',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      layers: [],
      base_assets: {
        background: '/templates/bases/thm-line-art-toast-base.png'
      }
    }
  };

  return templates[id] ?? null;
}
