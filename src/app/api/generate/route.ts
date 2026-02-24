import { NextRequest, NextResponse } from 'next/server';
import { generateMultipleImages, generateMultipleTextProposals } from '@/lib/abacus';
import { createPost, uploadImageToStorage } from '@/lib/supabase';
import { GenerateRequest, GenerateResponse, AbacusTextResponse } from '@/types';
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
        ai_model: 'claude-opus-4-6',
      })
      .select()
      .single();

    console.log(`[API] Generating content for ${project}: ${topic.substring(0, 50)}`);

    // Step 1: Generate 3 text proposals in parallel
    let textProposals: AbacusTextResponse[] = [];
    try {
      console.log('[API] Generating 3 text proposals...');
      textProposals = await generateMultipleTextProposals(topic, project, platform, 3);
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

    if (textProposals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate any text proposals' },
        { status: 500 }
      );
    }

    const primaryProposal = textProposals[0];
    console.log('[API] Text proposals generated:', textProposals.length);

    // Step 2: Gestione immagine — genera 3 proposte in parallelo
    let permanentImageUrl: string | null = null;
    let imageProposals: string[] = [];
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

    if (!permanentImageUrl) {
      imageSource = 'generated';
      try {
        console.log('[API] Generating 3 image proposals...');
        const imageResults = await generateMultipleImages(
          primaryProposal.image_prompt,
          3,
          { brand: project, platform }
        );

        // Upload all successful results to storage
        const uploadPromises = imageResults.map(async (result, idx) => {
          try {
            if (result.image_base64) {
              return await uploadImageToStorage(result.image_base64, `proposal-${idx}.png`, supabase);
            } else if (result.image_url) {
              return await uploadImageToStorage(result.image_url, `proposal-${idx}.png`, supabase);
            }
            return null;
          } catch (err) {
            console.error(`[API] Proposal ${idx} upload error:`, err);
            return null;
          }
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        imageProposals = uploadedUrls.filter((url): url is string => url !== null);

        // Set the first proposal as the default main image
        if (imageProposals.length > 0) {
          permanentImageUrl = imageProposals[0];
        }

        console.log(`[API] ${imageProposals.length} image proposals uploaded`);
      } catch (err) {
        console.error('[API] Image generation error:', err);
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
    }

    console.log('[API] Image ready:', permanentImageUrl || 'No image', `(${imageProposals.length} proposals)`);

    const generationTime = Date.now() - startTime;
    const wordCount = primaryProposal.body_copy?.split(/\s+/).length || 0;

    // Step 4: Save to database
    let post;
    try {
      console.log('[API] Saving post to database...', {
        user_id: userId,
        topic: topic.substring(0, 50),
        project,
        platform,
      });

      const postData = {
        user_id: userId,
        topic,
        title: primaryProposal.title,
        body_copy: primaryProposal.body_copy,
        hashtags: primaryProposal.hashtags,
        image_prompt: primaryProposal.image_prompt,
        image_url: permanentImageUrl,
        status: 'draft' as const,
        project,
        platform,
        generation_time_ms: generationTime,
        word_count: wordCount,
        ai_model: 'claude-opus-4-6',
        prompt_length: topic.length,
        template_used: template || (imageSource === 'uploaded' ? 'user-image' : 'ai-generated'),
      };

      post = await createPost(postData, supabase);

      console.log('[API] Post saved successfully:', post?.id);
    } catch (err) {
      console.error('[API] Database save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Try to update log entry, but don't fail if it doesn't work
      try {
        if (logEntry) {
          await supabase
            .from('generation_logs')
            .update({
              completed_at: new Date().toISOString(),
              duration_ms: generationTime,
              success: false,
              error_message: errorMessage,
            })
            .eq('id', logEntry.id);
        }
      } catch (logErr) {
        console.error('[API] Failed to update log:', logErr);
      }

      return NextResponse.json(
        { success: false, error: `Database save failed: ${errorMessage}` },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Failed to save post to database - no data returned' },
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

    // Attach image and text proposals to the response (text_proposals not saved to DB as separate posts, just returned)
    const responseData = {
      ...post,
      image_proposals: imageProposals.length > 1 ? imageProposals : undefined,
      selected_image_index: imageProposals.length > 1 ? 0 : undefined,
      text_proposals: textProposals.length > 1 ? textProposals : undefined,
      selected_text_index: textProposals.length > 1 ? 0 : undefined,
    };

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
