import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

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
  try {
    await getAuthenticatedUser();
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleApiKey) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const body: EditRequest = await request.json();
    const { imageBase64, operation, params } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

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
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    console.log(`[ImageEdit] Starting ${operation} with Nano Banana Pro 2 (gemini-3-pro-image-preview)`);

    // Extract raw base64 data (strip data URL prefix if present)
    let rawBase64 = imageBase64;
    let mimeType = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        rawBase64 = match[2];
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: editPrompt },
              {
                inlineData: {
                  mimeType,
                  data: rawBase64,
                },
              },
            ],
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ImageEdit] API error:', errorText);
      throw new Error(`Image edit API error: ${response.status}`);
    }

    const data = await response.json();
    let editedImageBase64: string | undefined;

    // Extract image from Gemini response
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          editedImageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!editedImageBase64) {
      throw new Error('No edited image received from API');
    }

    console.log('[ImageEdit] Operation completed successfully');
    return NextResponse.json({
      success: true,
      imageBase64: editedImageBase64,
      operation,
    });

  } catch (error) {
    console.error('[ImageEdit] Error:', error);
    return NextResponse.json(
      { error: 'Image editing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
