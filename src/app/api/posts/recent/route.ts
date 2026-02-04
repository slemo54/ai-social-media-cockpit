import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'default-user';

export async function GET(request: Request) {
  
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        body_copy,
        status,
        platform,
        template_used,
        created_at,
        image_url,
        word_count
      `)
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Formatta per la UI
    const formatted = posts?.map(post => ({
      id: post.id,
      title: post.title,
      preview: post.body_copy?.substring(0, 120) + '...' || 'No preview',
      status: post.status,
      platform: post.platform || 'instagram',
      template: post.template_used,
      date: new Date(post.created_at).toLocaleDateString('it-IT'),
      hasImage: !!post.image_url,
      wordCount: post.word_count,
    })) || [];
    
    return NextResponse.json({ posts: formatted });
  } catch (error) {
    console.error('Recent posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
