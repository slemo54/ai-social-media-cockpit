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
    
    // Fallback: se il DB ha errore o è vuoto, ritorna dati statici
    if (error || !templates || templates.length === 0) {
      if (error) console.warn('[Templates API] DB error, using static fallback:', error.message);
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
 * Dati statici di fallback — 5 template reali IWP basati su immagini episodi
 * Immagini base in public/templates/bases/ (generate con DALL-E 2 inpainting da AVIF reali)
 * photoZone: coordinate della zona foto nell'immagine originale 1001x999px
 */
function getStaticTemplates() {
  const textLayers = (nameY: number, titleY: number) => [
    {
      id: 'guest-name',
      type: 'text',
      name: 'Nome Ospite',
      zIndex: 10,
      editable: true,
      config: {
        defaultText: 'NOME OSPITE',
        fontFamily: 'serif',
        fontSize: 36,
        color: '#FFFFFF',
        alignment: 'center',
        position: { x: 500, y: nameY },
      },
    },
    {
      id: 'guest-title',
      type: 'text',
      name: 'Titolo / Azienda',
      zIndex: 10,
      editable: true,
      config: {
        defaultText: 'Titolo e Azienda',
        fontFamily: 'sans-serif',
        fontSize: 18,
        color: '#FFFFFF',
        alignment: 'center',
        position: { x: 500, y: titleY },
      },
    },
  ];

  return [
    {
      template_id: 'iwp-masterclass',
      name: 'Masterclass US Wine Market',
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1001, height: 999, format: 'square' },
      photoZone: { type: 'circle', centerX: 500, centerY: 390, radius: 228 },
      base_assets: { background: '/templates/bases/iwp-masterclass-base.png' },
      base_image_url: '/templates/bases/iwp-masterclass-base.png',
      layers: textLayers(720, 760),
    },
    {
      template_id: 'iwp-wine-food-travel',
      name: 'Wine Food & Travel',
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1001, height: 999, format: 'square' },
      photoZone: { type: 'circle', centerX: 500, centerY: 385, radius: 220 },
      base_assets: { background: '/templates/bases/iwp-wine-food-travel-base.png' },
      base_image_url: '/templates/bases/iwp-wine-food-travel-base.png',
      layers: textLayers(720, 760),
    },
    {
      template_id: 'iwp-on-the-road',
      name: 'On The Road Edition',
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1001, height: 999, format: 'square' },
      photoZone: { type: 'circle', centerX: 500, centerY: 390, radius: 228 },
      base_assets: { background: '/templates/bases/iwp-on-the-road-base.png' },
      base_image_url: '/templates/bases/iwp-on-the-road-base.png',
      layers: textLayers(720, 760),
    },
    {
      template_id: 'iwp-open-bar-stevie',
      name: '#OpenBarStevie',
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1001, height: 999, format: 'square' },
      photoZone: { type: 'circle', centerX: 500, centerY: 385, radius: 218 },
      base_assets: { background: '/templates/bases/iwp-open-bar-stevie-base.png' },
      base_image_url: '/templates/bases/iwp-open-bar-stevie-base.png',
      layers: textLayers(720, 760),
    },
    {
      template_id: 'iwp-wine2wine',
      name: 'wine2wine Vinitaly Business Forum',
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1001, height: 999, format: 'square' },
      photoZone: { type: 'rect', x: 0, y: 150, width: 1001, height: 590 },
      base_assets: { background: '/templates/bases/iwp-wine2wine-base.png' },
      base_image_url: '/templates/bases/iwp-wine2wine-base.png',
      layers: [
        {
          id: 'speaker-name',
          type: 'text',
          name: 'Nome Speaker',
          zIndex: 10,
          editable: true,
          config: {
            defaultText: 'NOME SPEAKER',
            fontFamily: 'serif',
            fontSize: 32,
            color: '#FFFFFF',
            alignment: 'center',
            position: { x: 500, y: 790 },
          },
        },
        {
          id: 'speaker-title',
          type: 'text',
          name: 'Titolo / Azienda',
          zIndex: 10,
          editable: true,
          config: {
            defaultText: 'Titolo e Azienda',
            fontFamily: 'sans-serif',
            fontSize: 16,
            color: '#FFFFFF',
            alignment: 'center',
            position: { x: 500, y: 825 },
          },
        },
      ],
    },
  ];
}
