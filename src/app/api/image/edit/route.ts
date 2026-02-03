import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ABACUS_API_KEY = process.env.ABACUS_API_KEY;
const ABACUS_BASE_URL = 'https://routellm.abacus.ai/v1';

export const maxDuration = 120;

interface EditRequest {
  imageBase64: string;
  operation: 'add_text' | 'remove_text' | 'remove_person' | 'enhance';
  params: {
    text?: string;
    position?: 'top' | 'center' | 'bottom';
    fontSize?: 'small' | 'medium' | 'large';
    color?: string;
    description?: string;
  };
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  // Verifica autenticazione
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ABACUS_API_KEY) {
    return NextResponse.json(
      { error: 'ABACUS_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body: EditRequest = await request.json();
    const { imageBase64, operation, params } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Costruisci il prompt in base all'operazione
    let editPrompt = '';
    switch (operation) {
      case 'add_text':
        editPrompt = `Add text "${params.text}" to the image. Position: ${params.position || 'center'}. Style: elegant, professional, wine-themed. The text should blend naturally with the image.`;
        break;
      case 'remove_text':
        editPrompt = `Remove all text from this image. Clean up any words, letters, or writing. Keep the image natural and seamless.`;
        break;
      case 'remove_person':
        editPrompt = `Remove all people/persons from this image. Keep the background natural and fill in the area where people were removed. Make it look like there were never people there.`;
        break;
      case 'enhance':
        editPrompt = `Enhance this wine image: improve lighting, make colors more vibrant, professional photography quality, 8k resolution look.`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    console.log(`[ImageEdit] Starting ${operation} operation`);

    // Chiamata all'API Abacus per editing immagine
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch(`${ABACUS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'nano-banana-pro',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: editPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        modalities: ['image'],
        image_config: { num_images: 1, aspect_ratio: '1:1' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ImageEdit] API error:', errorText);
      throw new Error(`Image edit API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Estrai l'immagine modificata
    let editedImageBase64: string | undefined;
    let editedImageUrl: string | undefined;

    if (data.choices?.[0]?.message) {
      const message = data.choices[0].message;
      
      if (message.images?.[0]) {
        if (message.images[0].b64_json) {
          editedImageBase64 = message.images[0].b64_json;
        } else if (message.images[0].image_url) {
          editedImageUrl = message.images[0].image_url.url;
        }
      }
      
      if (!editedImageBase64 && !editedImageUrl && message.content?.startsWith('data:image')) {
        editedImageBase64 = message.content.split(',')[1];
      }
    }

    if (!editedImageBase64 && !editedImageUrl) {
      throw new Error('No edited image received from API');
    }

    console.log('[ImageEdit] Operation completed successfully');

    return NextResponse.json({
      success: true,
      imageBase64: editedImageBase64,
      imageUrl: editedImageUrl,
      operation,
    });

  } catch (error) {
    console.error('[ImageEdit] Error:', error);
    return NextResponse.json(
      { 
        error: 'Image editing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
