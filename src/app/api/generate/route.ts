import { NextRequest, NextResponse } from 'next/server';
import { generateTextContent, generateImage } from '@/lib/abacus';
import { createPost, uploadImageToStorage } from '@/lib/supabase';
import { GenerateRequest, GenerateResponse } from '@/types';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const maxDuration = 180; // Aumentato a 3 minuti per generazione con immagine

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  const startTime = Date.now();
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[API] Missing Supabase env vars');
    return NextResponse.json(
      { success: false, error: 'Server configuration error: Supabase env vars not set' },
      { status: 500 }
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  try {
    // Verifica autenticazione - USA getUser() NON getSession()
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = user.id;

    // Verifica variabili d'ambiente
    if (!process.env.ABACUS_API_KEY && !process.env.NEXT_PUBLIC_ABACUS_API_KEY) {
      console.error('[API] Missing ABACUS_API_KEY');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: ABACUS_API_KEY not set' },
        { status: 500 }
      );
    }

    // Parse request body
    let body: GenerateRequest & { imageUrl?: string };
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { topic, project = 'IWP', imageUrl: userImageUrl } = body;

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Validazione progetto
    if (project !== 'IWP' && project !== 'IWA') {
      return NextResponse.json(
        { success: false, error: 'Project must be IWP or IWA' },
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
      textContent = await generateTextContent(topic, project);
    } catch (err) {
      console.error('[API] Text generation error:', err);
      
      // Log errore
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
      // L'utente ha caricato un'immagine
      console.log('[API] Using user uploaded image');
      imageSource = 'uploaded';
      
      // Se è una data URL, uploada a Supabase
      if (userImageUrl.startsWith('data:')) {
        try {
          permanentImageUrl = await uploadImageToStorage(userImageUrl, 'user-upload.jpg', supabase);
        } catch (err) {
          console.error('[API] User image upload error:', err);
          // Continua con generazione AI come fallback
          permanentImageUrl = null;
        }
      } else {
        // Già un URL remoto
        permanentImageUrl = userImageUrl;
      }
    }

    // Se non c'è immagine uploadata o l'upload è fallito, genera con AI
    if (!permanentImageUrl) {
      console.log('[API] Generating image with AI...');
      imageSource = 'generated';
      
      let imageResult;
      try {
        imageResult = await generateImage(textContent.image_prompt);
      } catch (err) {
        console.error('[API] Image generation error:', err);
        
        // Log errore ma continua senza immagine
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
        // Step 3: Upload image to storage
        try {
          if (imageResult.image_base64) {
            permanentImageUrl = await uploadImageToStorage(
              imageResult.image_base64,
              'generated-image.png',
              supabase
            );
          } else if (imageResult.image_url) {
            permanentImageUrl = await uploadImageToStorage(
              imageResult.image_url,
              'generated-image.png',
              supabase
            );
          }
        } catch (err) {
          console.error('[API] Image upload error:', err);
          // Continua senza immagine
        }
      }
    }

    console.log('[API] Image ready:', permanentImageUrl || 'No image');

    // Calcola metriche
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
        platform: 'instagram',
        generation_time_ms: generationTime,
        word_count: wordCount,
        ai_model: 'gemini-2.5-flash',
        prompt_length: topic.length,
        template_used: imageSource === 'uploaded' ? 'user-image' : 'ai-generated',
      }, supabase);
    } catch (err) {
      console.error('[API] Database save error:', err);
      
      // Log errore
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

    // Aggiorna log con successo
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

    return NextResponse.json({
      success: true,
      data: post,
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
