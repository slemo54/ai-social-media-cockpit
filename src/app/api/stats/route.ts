import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  
  // Verifica autenticazione - USA getUser() NON getSession()
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = user.id;
  
  try {
    // Query 1: Stats da user_stats (cached)
    const { data: cachedStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Query 2: Stats real-time per periodi
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('status, created_at, word_count, template_used')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    
    // Calcolo statistiche periodo
    const last30Days = recentPosts || [];
    const last7Days = last30Days.filter(p => new Date(p.created_at) >= sevenDaysAgo);
    
    const stats = {
      overview: {
        total: cachedStats?.total_posts || 0,
        published: cachedStats?.published_posts || 0,
        draft: cachedStats?.draft_posts || 0,
        favoriteTemplate: cachedStats?.favorite_template || null,
        totalWords: cachedStats?.total_words_generated || 0,
        avgGenerationTime: cachedStats?.avg_generation_time_ms || 0,
      },
      trends: {
        last30Days: {
          total: last30Days.length,
          published: last30Days.filter(p => p.status === 'published').length,
          words: last30Days.reduce((sum, p) => sum + (p.word_count || 0), 0),
        },
        last7Days: {
          total: last7Days.length,
          published: last7Days.filter(p => p.status === 'published').length,
          words: last7Days.reduce((sum, p) => sum + (p.word_count || 0), 0),
        },
        growthRate: calculateGrowthRate(last30Days, sevenDaysAgo),
      },
      templates: getTemplateBreakdown(last30Days),
      activity: getDailyActivity(last30Days),
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

function calculateGrowthRate(posts: any[], sevenDaysAgo: Date) {
  const recent = posts.filter(p => new Date(p.created_at) >= sevenDaysAgo).length;
  const previous = posts.filter(p => {
    const date = new Date(p.created_at);
    return date < sevenDaysAgo && date >= new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
  }).length;
  
  if (previous === 0) return recent > 0 ? 100 : 0;
  return Math.round(((recent - previous) / previous) * 100);
}

function getTemplateBreakdown(posts: any[]) {
  const templates: Record<string, number> = {};
  posts.forEach(p => {
    if (p.template_used) {
      templates[p.template_used] = (templates[p.template_used] || 0) + 1;
    }
  });
  return Object.entries(templates)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getDailyActivity(posts: any[]) {
  const days: Record<string, number> = {};
  const now = new Date();
  
  // Inizializza ultimi 7 giorni a 0
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days[date.toISOString().split('T')[0]] = 0;
  }
  
  posts.forEach(p => {
    const date = new Date(p.created_at).toISOString().split('T')[0];
    if (days[date] !== undefined) {
      days[date]++;
    }
  });
  
  return Object.entries(days).map(([date, count]) => ({ date, count }));
}
