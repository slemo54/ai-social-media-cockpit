/**
 * API Route: /api/image/dual-process
 * Orchestratore dual-API: OpenAI gpt-image-1 + Gemini
 *
 * Workflow ottimale Thumio-style:
 * 1. Gemini Flash → genera/raffina scene base
 * 2. OpenAI gpt-image-1 → inpainting, bg removal, face details
 * 3. Output → PNG con trasparenza per compositing
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import OpenAI, { toFile } from 'openai';

export const maxDuration = 180;

type OperationType =
  | 'remove_background'
  | 'inpainting'
  | 'style_transfer'
  | 'face_enhance'
  | 'generate_infographic'
  | 'add_text'
  | 'complex_layout'
  | 'enhance'
  | 'composite'; // applica foto sul template

type Provider = 'auto' | 'openai' | 'gemini';

interface ProcessOperation {
  type: OperationType;
  params?: Record<string, string | number | boolean>;
}

interface DualProcessRequest {
  /** Base64 immagine principale (con o senza data: prefix) */
  image: string;
  /** Lista operazioni da eseguire in sequenza */
  operations: ProcessOperation[];
  /** Contesto template opzionale (nome, colori, dimensioni) */
  templateContext?: {
    name?: string;
    category?: string;
    dimensions?: { width: number; height: number };
    colors?: string[];
  };
  /** Forza provider specifico (default: auto) */
  provider?: Provider;
}

// Mappa operazione → provider preferito
const OPERATION_PROVIDER: Record<OperationType, 'openai' | 'gemini'> = {
  remove_background: 'openai',
  inpainting: 'openai',
  style_transfer: 'openai',
  face_enhance: 'openai',
  generate_infographic: 'gemini',
  add_text: 'gemini',
  complex_layout: 'gemini',
  enhance: 'gemini',
  composite: 'gemini',
};

// ─── OpenAI operations ────────────────────────────────────────────────────────

async function runOpenAIOperation(
  imageBase64: string,
  mimeType: string,
  operation: ProcessOperation
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const imageFile = await toFile(imageBuffer, 'image.png', { type: mimeType });

  let prompt = '';
  switch (operation.type) {
    case 'remove_background':
      prompt = 'Remove the background completely, making it fully transparent. Keep the subject with precise, clean edges. Output PNG with transparency.';
      break;
    case 'inpainting':
      prompt = (operation.params?.prompt as string) || 'Fill this area naturally to match the surrounding context.';
      break;
    case 'style_transfer':
      prompt = `Apply professional editorial photography style. ${operation.params?.style || 'Enhance lighting, color grading, and visual quality.'}`;
      break;
    case 'face_enhance':
      prompt = 'Enhance facial details: smooth skin, sharpen eyes, improve lighting. Keep the person looking natural and professional.';
      break;
    default:
      prompt = (operation.params?.prompt as string) || 'Enhance this image professionally.';
  }

  console.log(`[DualProcess/OpenAI] ${operation.type}`);

  const response = await openai.images.edit({
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
    image: imageFile,
    prompt,
    size: '1024x1024',
  }) as { data?: Array<{ b64_json?: string; url?: string }> };

  const result = response.data?.[0];
  if (!result) throw new Error('No image returned from OpenAI');
  if (result.b64_json) return result.b64_json;

  if (result.url) {
    const res = await fetch(result.url);
    const buf = await res.arrayBuffer();
    return Buffer.from(buf).toString('base64');
  }

  throw new Error('OpenAI returned no image data');
}

// ─── Gemini operations ────────────────────────────────────────────────────────

async function runGeminiOperation(
  imageBase64: string,
  mimeType: string,
  operation: ProcessOperation,
  templateContext?: DualProcessRequest['templateContext']
): Promise<string> {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleApiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  let prompt = '';
  const ctxInfo = templateContext
    ? `Template: "${templateContext.name}", category: ${templateContext.category}, brand colors: ${templateContext.colors?.join(', ') || 'default'}.`
    : '';

  switch (operation.type) {
    case 'enhance':
      prompt = `Enhance this wine/hospitality image: improve lighting, colors, sharpness. Professional photography quality. ${ctxInfo}`;
      break;
    case 'add_text':
      prompt = `Add text "${operation.params?.text || ''}" to the image at position ${operation.params?.position || 'center'}. Elegant, professional typography. ${ctxInfo}`;
      break;
    case 'generate_infographic':
      prompt = `Transform this into a professional wine education infographic with clear sections, icons, and data visualization. ${ctxInfo} ${operation.params?.description || ''}`;
      break;
    case 'complex_layout':
      prompt = `Redesign with editorial layout: visual hierarchy, typography zones, brand-consistent design. ${ctxInfo} ${operation.params?.description || ''}`;
      break;
    case 'composite':
      prompt = `Composite this image onto the template canvas. Maintain proportions, adjust color balance to match template style. ${ctxInfo}`;
      break;
    default:
      prompt = (operation.params?.prompt as string) || `Process this image professionally. ${ctxInfo}`;
  }

  // Usa Pro per layout complessi, Flash per enhancement veloce
  const useProModel = ['generate_infographic', 'complex_layout'].includes(operation.type);
  const model = useProModel
    ? (process.env.GEMINI_PRO_IMAGE_MODEL || 'gemini-2.5-flash-image')
    : (process.env.GEMINI_FLASH_IMAGE_MODEL || 'gemini-2.5-flash-image');

  console.log(`[DualProcess/Gemini] ${operation.type}, model: ${model}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
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
    const body: DualProcessRequest = await request.json();
    const { image, operations, templateContext, provider = 'auto' } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    if (!operations || operations.length === 0) {
      return NextResponse.json({ error: 'At least one operation is required' }, { status: 400 });
    }

    // Strip data URL prefix
    let currentBase64 = image;
    let mimeType = 'image/jpeg';
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        currentBase64 = match[2];
      }
    }

    const steps: Array<{ operation: string; provider: string; success: boolean }> = [];

    // Esegui operazioni in sequenza (output di ogni step → input del prossimo)
    for (const operation of operations) {
      const preferredProvider = provider === 'auto'
        ? OPERATION_PROVIDER[operation.type]
        : provider;

      try {
        if (preferredProvider === 'openai') {
          if (!process.env.OPENAI_API_KEY) {
            console.warn(`[DualProcess] OpenAI key missing, falling back to Gemini for ${operation.type}`);
            currentBase64 = await runGeminiOperation(currentBase64, mimeType, operation, templateContext);
            steps.push({ operation: operation.type, provider: 'gemini-fallback', success: true });
          } else {
            currentBase64 = await runOpenAIOperation(currentBase64, mimeType, operation);
            steps.push({ operation: operation.type, provider: 'openai', success: true });
          }
        } else {
          currentBase64 = await runGeminiOperation(currentBase64, mimeType, operation, templateContext);
          steps.push({ operation: operation.type, provider: 'gemini', success: true });
        }

        // Dopo bg removal, il risultato è PNG trasparente
        if (operation.type === 'remove_background') {
          mimeType = 'image/png';
        }
      } catch (stepError) {
        console.error(`[DualProcess] Step ${operation.type} failed:`, stepError);
        steps.push({ operation: operation.type, provider: preferredProvider, success: false });
        // Continua con l'immagine precedente se uno step fallisce
      }
    }

    return NextResponse.json({
      success: true,
      imageBase64: currentBase64,
      mimeType,
      steps,
      operationsCompleted: steps.filter(s => s.success).length,
      operationsTotal: operations.length,
    });

  } catch (error) {
    console.error('[DualProcess] Error:', error);
    return NextResponse.json(
      { error: 'Dual process failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
