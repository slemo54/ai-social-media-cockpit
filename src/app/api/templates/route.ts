/**
 * API Route: /api/templates
 * Gestione template Thumio-style
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

/**
 * GET /api/templates
 * Lista template con filtri opzionali
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const supabase = getSupabaseClient();

    // If Supabase is not configured, return static templates
    if (!supabase) {
      return NextResponse.json({
        templates: getStaticTemplates(category, type, search),
        source: 'static'
      });
    }

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
      console.error('[Templates API] Database error:', error.message);
      // Fallback to static on DB error
      return NextResponse.json({
        templates: getStaticTemplates(category, type, search),
        source: 'static',
        warning: 'Database unavailable, using static templates'
      });
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json({
        templates: getStaticTemplates(category, type, search),
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
    return NextResponse.json({
      templates: getStaticTemplates(),
      source: 'static',
      warning: 'Error occurred, using static templates'
    });
  }
}

/**
 * Dati statici di fallback con filtro opzionale
 */
function getStaticTemplates(
  category?: string | null,
  type?: string | null,
  search?: string | null
): Template[] {
  const all: Template[] = [
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
        background: '/templates/bases/thm-line-art-toast-base.png'
      }
    }
  ];

  return all.filter(t => {
    if (category && t.category !== category.toUpperCase()) return false;
    if (type && t.type !== type) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
}
