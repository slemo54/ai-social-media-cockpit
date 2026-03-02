/**
 * API Route: /api/templates
 * Gestione template Thumio-style
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/templates
 * Lista template con filtri opzionali
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtri
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    
    // Costruisci query
    let query = supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category.toUpperCase());
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data: templates, error } = await query;
    
    if (error) {
      console.error('[Templates API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }
    
    // Fallback: se il DB non è disponibile, ritorna dati statici
    if (!templates || templates.length === 0) {
      return NextResponse.json({
        templates: getStaticTemplates(),
        source: 'static'
      });
    }
    
    return NextResponse.json({
      templates,
      count: templates.length,
      source: 'database'
    });
    
  } catch (error) {
    console.error('[Templates API] Error:', error);
    // Fallback a dati statici
    return NextResponse.json({
      templates: getStaticTemplates(),
      source: 'static'
    });
  }
}

/**
 * Dati statici di fallback
 */
function getStaticTemplates() {
  return [
    {
      template_id: 'iwp-ambassador-circle',
      name: "Ambassador's Corner",
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1080, height: 1080, format: 'square' },
      base_assets: {
        background: '/templates/bases/iwp-ambassador-circle-base.png',
        demoFigure: '/templates/assets/demo-figure-circle.png'
      }
    },
    {
      template_id: 'iwp-masterclass-duo',
      name: 'Masterclass Duo',
      category: 'IWP',
      type: 'event',
      dimensions: { width: 1080, height: 1080, format: 'square' },
      base_assets: {
        background: '/templates/bases/iwp-masterclass-duo-base.png',
        demoFigure: '/templates/assets/demo-figure-duo.png'
      }
    },
    {
      template_id: 'iwa-wset-level1',
      name: 'WSET Level 1',
      category: 'IWA',
      type: 'course',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      base_assets: {
        background: '/templates/bases/iwa-wset-level1-base.png',
        demoFigure: '/templates/assets/demo-figure-portrait.png'
      }
    },
    {
      template_id: 'thm-minimal-bordeaux',
      name: 'Minimal Bordeaux',
      category: 'UNIVERSAL',
      type: 'portrait',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      base_assets: {
        background: '/templates/bases/thm-minimal-bordeaux-base.png',
        demoFigure: '/templates/assets/demo-figure-portrait.png'
      }
    },
    {
      template_id: 'thm-line-art-toast',
      name: 'Line Art Toast',
      category: 'UNIVERSAL',
      type: 'quote',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      base_assets: {
        background: '/templates/bases/thm-line-art-toast-base.png',
        demoFigure: null
      }
    }
  ];
}
