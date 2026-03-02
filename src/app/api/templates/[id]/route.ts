/**
 * API Route: /api/templates/[id]
 * Dettaglio singolo template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('template_id', id)
      .single();
    
    if (error || !template) {
      // Cerca nei template statici
      const staticTemplate = getStaticTemplate(id);
      if (staticTemplate) {
        return NextResponse.json({ template: staticTemplate, source: 'static' });
      }
      
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template, source: 'database' });
    
  } catch (error) {
    console.error('[Template Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

function getStaticTemplate(id: string) {
  const templates: Record<string, any> = {
    'iwp-ambassador-circle': {
      template_id: 'iwp-ambassador-circle',
      name: "Ambassador's Corner",
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1080, height: 1080, format: 'square' },
      layers: [
        { id: 'photo-circle', type: 'image', name: 'Foto Ospite', zIndex: 1, editable: true, position: { x: 290, y: 200 }, size: { width: 500, height: 500 }, config: { mask: 'circle' } },
        { id: 'title-arch', type: 'text', name: 'Titolo', zIndex: 2, editable: true, config: { defaultText: "AMBASSADOR'S CORNER", fontFamily: 'Playfair Display', fontSize: 48, color: '#FFFFFF' } },
        { id: 'guest-name', type: 'text', name: 'Nome Ospite', zIndex: 4, editable: true, config: { defaultText: 'Nome Ospite', fontFamily: 'Inter', fontSize: 32, color: '#FFFFFF' } }
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
    'thm-minimal-bordeaux': {
      template_id: 'thm-minimal-bordeaux',
      name: 'Minimal Bordeaux',
      category: 'UNIVERSAL',
      type: 'portrait',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      layers: [
        { id: 'figure', type: 'image', name: 'Figura Principale', zIndex: 1, editable: true, position: { x: 340, y: 300 }, size: { width: 400, height: 600 } }
      ],
      base_assets: {
        background: '/templates/bases/thm-minimal-bordeaux-base.png',
        demoFigure: '/templates/assets/demo-figure-portrait.png'
      }
    }
  };
  
  return templates[id] || null;
}
