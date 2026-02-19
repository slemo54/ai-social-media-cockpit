import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  let userId: string;
  let supabase: any;

  try {
    const auth = await getAuthenticatedUser();
    userId = auth.userId;
    supabase = auth.supabase;
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    // Get all posts (not filtered by user_id for anonymous mode)
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`id, title, body_copy, status, platform, template_used, created_at, image_url, word_count`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      // Return empty array instead of error for better UX
      return NextResponse.json({ posts: [] });
    }

    const formatted = posts?.map((post: any) => ({
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
    // Return empty array instead of error
    return NextResponse.json({ posts: [] });
  }
}
