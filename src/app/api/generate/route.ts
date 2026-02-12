import { NextRequest, NextResponse } from 'next/server';
import { generateTextContent, generateImage } from '@/lib/abacus';
import { createPost, uploadImageToStorage } from '@/lib/supabase';
import { GenerateRequest, GenerateResponse } from '@/types';
import { getAuthenticatedUser } from '@/lib/auth';

export const maxDuration = 180;

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  const startTime = Date.now();

  let userId: string;
  let supabase: any;

  try {
    const auth = await getAuthenticatedUser();
    userId = auth.userId;
    supabase = auth.supabase;
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // Verifica variabili d'ambiente
    if (!process.env.ABACUS_API_KEY && !process.env.NEXT_PUBLIC_ABACUS_API_KEY) {
      console.error('[API] Missing ABACUS_API_KEY');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: ABACUS_API_KEY not set' },
        { status: 500 }
      );
    }

    // Parse request body
    let body: GenerateRequest;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { topic, project = 'IWP', imageUrl: userImageUrl, platform = 'instagram', template } = body;

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (project !== 'IWP' && project !== 'IWA') {
      return NextResponse.json(
        { success: false, error: 'Project must be IWP or IWA' },
        { status: 400 }
      );
    }

    const VALID_PLATFORMS = ['instagram', 'linkedin', 'facebook', 'twitter', 'tiktok'];
    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      );
    }

    // Log inizio generazione
    const { data: logEntry } = await supabase
      .from('generation_logs')
      .insert({
        user_id: userId,
        started_at: new Date().toISOString(),
        prompt_input: topic,
        ai_model: 'gemini-2.5-flash',
      })
      .select()
      .single();

    console.log(`[API] Generating content for ${project}: ${topic.substring(0, 50)}`);

    // Step 1: Generate text content
    let textContent;
    try {
      textContent = await generateTextContent(topic, project, platform);
    } catch (err) {
      console.error('[API] Text generation error:', err);
      if (logEntry) {
        await supabase
          .from('generation_logs')
          .update({
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            success: false,
            error_message: err instanceof Error ? err.message : 'Text generation failed',
          })
          .eq('id', logEntry.id);
      }
      return NextResponse.json(
        { success: false, error: `Text generation failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (!textContent) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate text content' },
        { status: 500 }
      );
    }

    console.log('[API] Text generated:', textContent.title?.substring(0, 50));

    // Step 2: Gestione immagine
    let permanentImageUrl: string | null = null;
    let imageSource: 'generated' | 'uploaded' = 'generated';

    if (userImageUrl) {
      console.log('[API] Using user uploaded image');
      imageSource = 'uploaded';
      if (userImageUrl.startsWith('data:')) {
        try {
          permanentImageUrl = await uploadImageToStorage(userImageUrl, 'user-upload.jpg', supabase);
        } catch (err) {
          console.error('[API] User image upload error:', err);
          permanentImageUrl = null;
        }
      } else {
        permanentImageUrl = userImageUrl;
      }
    }

    let imageDebugError: string | undefined;
    if (!permanentImageUrl) {
      console.log('[API] Generating image with AI...');
      console.log('[API] GOOGLE_AI_API_KEY set:', !!process.env.GOOGLE_AI_API_KEY, 'length:', process.env.GOOGLE_AI_API_KEY?.length);
      imageSource = 'generated';
      let imageResult;
      try {
        imageResult = await generateImage(textContent.image_prompt, { brand: project, platform });
        if (!imageResult) {
          imageDebugError = 'generateImage returned null (API key missing or no image data)';
        }
      } catch (err) {
        imageDebugError = `generateImage: ${err instanceof Error ? err.message : String(err)}`;
        console.error('[API] Image generation error:', imageDebugError);
        if (logEntry) {
          await supabase
            .from('generation_logs')
            .update({
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
              success: false,
              error_message: err instanceof Error ? err.message : 'Image generation failed',
            })
            .eq('id', logEntry.id);
        }
      }

      if (imageResult) {
        try {
          if (imageResult.image_base64) {
            permanentImageUrl = await uploadImageToStorage(imageResult.image_base64, 'generated-image.png', supabase);
          } else if (imageResult.image_url) {
            permanentImageUrl = await uploadImageToStorage(imageResult.image_url, 'generated-image.png', supabase);
          }
        } catch (err) {
          imageDebugError = `uploadImage: ${err instanceof Error ? err.message : String(err)}`;
          console.error('[API] Image upload error:', imageDebugError);
        }
      }
    }

    console.log('[API] Image ready:', permanentImageUrl || 'No image');

    const generationTime = Date.now() - startTime;
    const wordCount = textContent.body_copy?.split(/\s+/).length || 0;

    // Step 4: Save to database
    let post;
    try {
      post = await createPost({
        user_id: userId,
        topic,
        title: textContent.title,
        body_copy: textContent.body_copy,
        hashtags: textContent.hashtags,
        image_prompt: textContent.image_prompt,
        image_url: permanentImageUrl,
        status: 'draft',
        project,
        platform,
        generation_time_ms: generationTime,
        word_count: wordCount,
        ai_model: 'gemini-2.5-flash',
        prompt_length: topic.length,
        template_used: template || (imageSource === 'uploaded' ? 'user-image' : 'ai-generated'),
      }, supabase);
    } catch (err) {
      console.error('[API] Database save error:', err);
      if (logEntry) {
        await supabase
          .from('generation_logs')
          .update({
            completed_at: new Date().toISOString(),
            duration_ms: generationTime,
            success: false,
            error_message: err instanceof Error ? err.message : 'Database save failed',
          })
          .eq('id', logEntry.id);
      }
      return NextResponse.json(
        { success: false, error: `Database save failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Failed to save post to database' },
        { status: 500 }
      );
    }

    console.log('[API] Post saved:', post.id);

    if (logEntry) {
      await supabase
        .from('generation_logs')
        .update({
          post_id: post.id,
          completed_at: new Date().toISOString(),
          duration_ms: generationTime,
          success: true,
        })
        .eq('id', logEntry.id);
    }

    return NextResponse.json({ success: true, data: post, _v: 'debug-v3', _imageDebug: imageDebugError || 'no-error-captured' });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
