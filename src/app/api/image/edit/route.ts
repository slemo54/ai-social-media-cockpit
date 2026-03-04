import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import OpenAI from 'openai';
import { toFile } from 'openai';

export const maxDuration = 120;

// Operazioni che usano OpenAI gpt-image-1
const OPENAI_OPERATIONS = new Set([
  'remove_background',
  'inpainting',
  'style_transfer',
  'face_enhance',
]);

// Operazioni che usano Gemini
const GEMINI_OPERATIONS = new Set([
  'generate_infographic',
  'add_text',
  'complex_layout',
  'enhance',
  // Legacy operations (backward compat)
  'remove_text',
  'remove_person',
]);

type Operation =
  | 'remove_background'
  | 'inpainting'
  | 'style_transfer'
  | 'face_enhance'
  | 'generate_infographic'
  | 'add_text'
  | 'complex_layout'
  | 'enhance'
  | 'remove_text'
  | 'remove_person';

interface EditRequest {
  imageBase64: string;
  operation: Operation;
  params: {
    text?: string;
    position?: 'top' | 'center' | 'bottom';
    fontSize?: 'small' | 'medium' | 'large';
    color?: string;
    description?: string;
    customPrompt?: string;
    maskBase64?: string; // per inpainting
  };
}

// ─── OpenAI handler ──────────────────────────────────────────────────────────

async function processWithOpenAI(
  imageBase64: string,
  mimeType: string,
  operation: Operation,
  params: EditRequest['params']
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Converti base64 → Buffer → File
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const imageFile = await toFile(imageBuffer, 'image.png', { type: mimeType });

  let prompt = '';
  switch (operation) {
    case 'remove_background':
      prompt = 'Remove the background completely, making it fully transparent. Keep the subject sharp and clean with precise edges. Professional cutout quality.';
      break;
    case 'inpainting':
      prompt = params.customPrompt || params.description || 'Fill this area naturally to match the surrounding context.';
      break;
    case 'style_transfer':
      prompt = `Apply a professional, editorial photography style. Enhance lighting, color grading, and overall visual quality. ${params.customPrompt || ''}`.trim();
      break;
    case 'face_enhance':
      prompt = 'Enhance facial details: improve skin smoothness, sharpen eyes and features, improve lighting on the face. Keep the person looking natural and professional.';
      break;
    default:
      prompt = params.customPrompt || 'Enhance this image professionally.';
  }

  if (params.customPrompt && !['inpainting'].includes(operation)) {
    prompt += ` Additional: ${params.customPrompt}`;
  }

  console.log(`[ImageEdit/OpenAI] Operation: ${operation}`);

  const editParams: Parameters<typeof openai.images.edit>[0] = operation === 'inpainting' && params.maskBase64
    ? {
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        image: imageFile,
        prompt,
        size: '1024x1024',
        mask: await toFile(Buffer.from(params.maskBase64, 'base64'), 'mask.png', { type: 'image/png' }),
      }
    : {
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        image: imageFile,
        prompt,
        size: '1024x1024',
      };

  const response = await openai.images.edit(editParams) as { data?: Array<{ b64_json?: string; url?: string }> };

  const result = response.data?.[0];
  if (!result) throw new Error('No image returned from OpenAI');

  // gpt-image-1 returns b64_json
  if (result.b64_json) return result.b64_json;

  // Fallback: se per qualche motivo c'è url, scaricalo
  if (result.url) {
    const imageResponse = await fetch(result.url);
    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }

  throw new Error('OpenAI returned neither b64_json nor url');
}

// ─── Gemini handler ───────────────────────────────────────────────────────────

async function processWithGemini(
  imageBase64: string,
  mimeType: string,
  operation: Operation,
  params: EditRequest['params']
): Promise<string> {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleApiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  let editPrompt = '';
  switch (operation) {
    case 'add_text':
      editPrompt = `Add text "${params.text}" to the image. Position: ${params.position || 'center'}. Style: elegant, professional, wine-themed. The text should blend naturally with the image.`;
      break;
    case 'remove_text':
      editPrompt = 'Remove all text from this image. Clean up any words, letters, or writing. Keep the image natural and seamless.';
      break;
    case 'remove_person':
      editPrompt = 'Remove all people/persons from this image. Keep the background natural and fill in the area where people were removed. Make it look like there were never people there.';
      break;
    case 'enhance':
      editPrompt = 'Enhance this wine image: improve lighting, make colors more vibrant, professional photography quality, 8k resolution look.';
      break;
    case 'generate_infographic':
      editPrompt = `Transform this into a professional infographic with clear sections, icons, and data visualization. ${params.customPrompt || ''}`.trim();
      break;
    case 'complex_layout':
      editPrompt = `Redesign this with a complex editorial layout. Add visual hierarchy, typography zones, and brand-consistent design. ${params.customPrompt || ''}`.trim();
      break;
    default:
      editPrompt = params.customPrompt || 'Enhance this image professionally.';
  }

  if (params.customPrompt && !['add_text', 'generate_infographic', 'complex_layout'].includes(operation)) {
    editPrompt += ` Additional instructions: ${params.customPrompt.trim()}`;
  }

  const model = process.env.GEMINI_PRO_IMAGE_MODEL || 'gemini-2.5-flash-image';
  console.log(`[ImageEdit/Gemini] Operation: ${operation}, model: ${model}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: editPrompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
      signal: controller.signal,
    }
  );

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) return part.inlineData.data;
  }

  throw new Error('No image in Gemini response');
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    await getAuthenticatedUser();
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body: EditRequest = await request.json();
    const { imageBase64, operation, params } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!OPENAI_OPERATIONS.has(operation) && !GEMINI_OPERATIONS.has(operation)) {
      return NextResponse.json({ error: `Invalid operation: ${operation}` }, { status: 400 });
    }

    // Strip data URL prefix
    let rawBase64 = imageBase64;
    let mimeType = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        rawBase64 = match[2];
      }
    }

    const useOpenAI = OPENAI_OPERATIONS.has(operation);
    const provider = useOpenAI ? 'OpenAI gpt-image-1' : 'Gemini';
    console.log(`[ImageEdit] Routing ${operation} → ${provider}`);

    let editedImageBase64: string;
    if (useOpenAI) {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
      }
      editedImageBase64 = await processWithOpenAI(rawBase64, mimeType, operation, params);
    } else {
      if (!process.env.GOOGLE_AI_API_KEY) {
        return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
      }
      editedImageBase64 = await processWithGemini(rawBase64, mimeType, operation, params);
    }

    console.log(`[ImageEdit] ${operation} completed via ${provider}`);
    return NextResponse.json({
      success: true,
      imageBase64: editedImageBase64,
      operation,
      provider: useOpenAI ? 'openai' : 'gemini',
    });

  } catch (error) {
    console.error('[ImageEdit] Error:', error);
    return NextResponse.json(
      { error: 'Image editing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
