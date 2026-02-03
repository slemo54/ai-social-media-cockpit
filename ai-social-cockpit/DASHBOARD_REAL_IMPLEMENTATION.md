# 📊 Dashboard Reale - Piano di Implementazione Completo

## Overview

Trasformare la dashboard da mock statico a sistema reale con dati live da Supabase, analytics accurate e UX professionale.

**Tempo stimato:** 2-3 giorni
**Priorità:** CRITICA (bloccante per credibilità del prodotto)

---

## 1. Schema Database Supabase

### 1.1 Estensione Tabella `posts`

```sql
-- Aggiungere campi mancanti alla tabella posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'instagram'; -- instagram, linkedin, tiktok, twitter
ALTER TABLE posts ADD COLUMN IF NOT EXISTS template_used VARCHAR(100); -- quale template ha generato il post
ALTER TABLE posts ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER; -- tempo di generazione in millisecondi
ALTER TABLE posts ADD COLUMN IF NOT EXISTS word_count INTEGER; -- conteggio parole generate
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_model VARCHAR(50) DEFAULT 'gemini-2.5-flash'; -- modello usato
ALTER TABLE posts ADD COLUMN IF NOT EXISTS prompt_length INTEGER; -- lunghezza prompt input
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS copied_count INTEGER DEFAULT 0; -- quante volte copiato

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
```

### 1.2 Tabella `user_stats` (Materialized View Manuale)

```sql
-- Tabella per caching stats (aggiornata via trigger o cron)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_posts INTEGER DEFAULT 0,
  published_posts INTEGER DEFAULT 0,
  draft_posts INTEGER DEFAULT 0,
  total_words_generated INTEGER DEFAULT 0,
  avg_generation_time_ms INTEGER DEFAULT 0,
  favorite_template VARCHAR(100),
  last_post_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger per auto-update stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_posts, updated_at)
  VALUES (
    NEW.user_id,
    (SELECT COUNT(*) FROM posts WHERE user_id = NEW.user_id),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_posts = (SELECT COUNT(*) FROM posts WHERE user_id = NEW.user_id),
    published_posts = (SELECT COUNT(*) FROM posts WHERE user_id = NEW.user_id AND status = 'published'),
    draft_posts = (SELECT COUNT(*) FROM posts WHERE user_id = NEW.user_id AND status = 'draft'),
    total_words_generated = (SELECT COALESCE(SUM(word_count), 0) FROM posts WHERE user_id = NEW.user_id),
    avg_generation_time_ms = (SELECT COALESCE(AVG(generation_time_ms), 0)::INTEGER FROM posts WHERE user_id = NEW.user_id AND generation_time_ms IS NOT NULL),
    favorite_template = (
      SELECT template_used 
      FROM posts 
      WHERE user_id = NEW.user_id AND template_used IS NOT NULL
      GROUP BY template_used 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    last_post_at = (SELECT MAX(created_at) FROM posts WHERE user_id = NEW.user_id),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_stats_update
AFTER INSERT OR UPDATE OR DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION update_user_stats();
```

### 1.3 Tabella `generation_logs` (Per Analytics Dettagliate)

```sql
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  post_id UUID REFERENCES posts(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  template_used VARCHAR(100),
  prompt_input TEXT,
  prompt_enhanced TEXT,
  ai_model VARCHAR(50),
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at DESC);
```

---

## 2. API Routes - Implementazione

### 2.1 `/api/stats` - Dashboard Stats Real-time

Crea file: `my-app/src/app/api/stats/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verifica autenticazione
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  
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
```

### 2.2 `/api/posts/recent` - Contenuti Recenti

Crea file: `my-app/src/app/api/posts/recent/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
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
      .eq('user_id', session.user.id)
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
```

### 2.3 `/api/generate` - Aggiornata con Tracking

Aggiorna: `my-app/src/app/api/generate/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ABACUS_API_KEY = process.env.ABACUS_API_KEY;
const ABACUS_BASE_URL = 'https://routellm.abacus.ai/v1';

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { topic, template, platform = 'instagram' } = body;
    
    // Log inizio generazione
    const { data: logEntry } = await supabase
      .from('generation_logs')
      .insert({
        user_id: session.user.id,
        started_at: new Date().toISOString(),
        template_used: template,
        prompt_input: topic,
        ai_model: 'gemini-2.5-flash',
      })
      .select()
      .single();
    
    // ... resto della logica di generazione esistente ...
    
    const generationTime = Date.now() - startTime;
    const wordCount = content.body_copy?.split(/\s+/).length || 0;
    
    // Salva post con metadati
    const { data: post, error: dbError } = await supabase
      .from('posts')
      .insert({
        user_id: session.user.id,
        title: content.title,
        body_copy: content.body_copy,
        hashtags: content.hashtags,
        image_prompt: content.image_prompt,
        platform,
        template_used: template,
        generation_time_ms: generationTime,
        word_count: wordCount,
        status: 'draft',
      })
      .select()
      .single();
    
    // Aggiorna log
    if (logEntry) {
      await supabase
        .from('generation_logs')
        .update({
          post_id: post.id,
          completed_at: new Date().toISOString(),
          duration_ms: generationTime,
          success: true,
          prompt_enhanced: enhancedPrompt,
        })
        .eq('id', logEntry.id);
    }
    
    return NextResponse.json({
      ...content,
      id: post.id,
      generationTime,
      wordCount,
    });
    
  } catch (error) {
    // Log errore
    await supabase.from('generation_logs').insert({
      user_id: session.user.id,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });
    
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
```

---

## 3. Componenti Dashboard - Refactor Completo

### 3.1 Hook `useDashboardStats`

Crea: `my-app/src/hooks/useDashboardStats.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  overview: {
    total: number;
    published: number;
    draft: number;
    favoriteTemplate: string | null;
    totalWords: number;
    avgGenerationTime: number;
  };
  trends: {
    last30Days: { total: number; published: number; words: number };
    last7Days: { total: number; published: number; words: number };
    growthRate: number;
  };
  templates: { name: string; count: number }[];
  activity: { date: string; count: number }[];
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchStats();

  return { stats, loading, error, refresh };
}
```

### 3.2 Hook `useRecentPosts`

Crea: `my-app/src/hooks/useRecentPosts.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';

interface RecentPost {
  id: string;
  title: string;
  preview: string;
  status: 'draft' | 'published';
  platform: string;
  template: string;
  date: string;
  hasImage: boolean;
  wordCount: number;
}

export function useRecentPosts(limit = 10) {
  const [posts, setPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [limit]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/recent?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { posts, loading, error, refresh: fetchPosts };
}
```

### 3.3 Componente `StatCard` - Real-time

Crea: `my-app/src/components/dashboard/StatCard.tsx`

```typescript
'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number; // percentuale
  changeLabel?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

export function StatCard({ label, value, change, changeLabel = 'vs scorso mese', icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-600';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg text-purple-600">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      
      {changeLabel && (
        <div className="text-xs text-gray-400 mt-2">{changeLabel}</div>
      )}
    </div>
  );
}
```

### 3.4 Componente `ActivityChart`

Crea: `my-app/src/components/dashboard/ActivityChart.tsx`

```typescript
'use client';

interface ActivityChartProps {
  data: { date: string; count: number }[];
  loading?: boolean;
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Attività Ultimi 7 Giorni</h3>
      
      <div className="flex items-end gap-2 h-48">
        {data.map((day, index) => {
          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
          const date = new Date(day.date);
          const dayName = days[date.getDay()];
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex items-end justify-center">
                <div
                  className="w-full max-w-12 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all duration-500 hover:from-purple-600 hover:to-pink-600"
                  style={{ height: `${Math.max(height, 4)}%` }}
                >
                  {day.count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700">
                      {day.count}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 3.5 Componente `TemplateStats`

Crea: `my-app/src/components/dashboard/TemplateStats.tsx`

```typescript
'use client';

import { CONTENT_TEMPLATES } from '@/lib/abacus';

interface TemplateStatsProps {
  templates: { name: string; count: number }[];
  loading?: boolean;
}

const templateIcons: Record<string, string> = {
  'on-the-road': '🚗',
  'wine-geek': '🤓',
  'cin-cin-community': '🥂',
  'scienza-bite': '🔬',
  'behind-scenes': '🎬',
  'new-discovery': '✨',
  'wine2wine': '🎤',
  'via-academy': '🎓',
};

export function TemplateStats({ templates, loading }: TemplateStatsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const total = templates.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Più Usati</h3>
      
      <div className="space-y-3">
        {templates.length === 0 ? (
          <p className="text-gray-500 text-sm">Nessun dato disponibile</p>
        ) : (
          templates.map((template) => {
            const percentage = total > 0 ? (template.count / total) * 100 : 0;
            const icon = templateIcons[template.name] || '📝';
            
            return (
              <div key={template.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-gray-700">
                      {CONTENT_TEMPLATES[template.name]?.name || template.name}
                    </span>
                  </span>
                  <span className="text-gray-500">{template.count} usi</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

### 3.6 Componente `RecentPostsList` - Real

Crea: `my-app/src/components/dashboard/RecentPostsList.tsx`

```typescript
'use client';

import Link from 'next/link';
import { Clock, CheckCircle, Image as ImageIcon, FileText } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  preview: string;
  status: 'draft' | 'published';
  platform: string;
  template: string;
  date: string;
  hasImage: boolean;
  wordCount: number;
}

interface RecentPostsListProps {
  posts: Post[];
  loading?: boolean;
}

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  linkedin: 'bg-blue-100 text-blue-700',
  tiktok: 'bg-black text-white',
  twitter: 'bg-sky-100 text-sky-700',
};

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'X/Twitter',
};

export function RecentPostsList({ posts, loading }: RecentPostsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
                <div className="w-full h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun contenuto ancora</h3>
        <p className="text-gray-500 mb-4">Inizia generando il tuo primo post!</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
        >
          Genera il primo post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/?edit=${post.id}`}
          className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
        >
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {post.hasImage ? (
                <ImageIcon className="w-6 h-6 text-purple-500" />
              ) : (
                <FileText className="w-6 h-6 text-purple-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                  {post.title}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${platformColors[post.platform] || 'bg-gray-100 text-gray-600'}`}>
                  {platformLabels[post.platform] || post.platform}
                </span>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{post.preview}</p>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  {post.status === 'published' ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-green-600">Pubblicato</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" />
                      <span>Bozza</span>
                    </>
                  )}
                </span>
                <span>{post.date}</span>
                <span>{post.wordCount} parole</span>
                {post.template && (
                  <span className="text-purple-500">{post.template}</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

---

## 4. Dashboard Page - Refactor Completo

Aggiorna: `my-app/src/app/dashboard/page.tsx`

```typescript
'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { TemplateStats } from '@/components/dashboard/TemplateStats';
import { RecentPostsList } from '@/components/dashboard/RecentPostsList';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { FileText, CheckCircle, Clock, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useDashboardStats();
  const { posts, loading: postsLoading, error: postsError, refresh: refreshPosts } = useRecentPosts(10);

  const handleRefresh = () => {
    refreshStats();
    refreshPosts();
  };

  if (statsError || postsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Errore nel caricamento dei dati</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← Torna al generatore
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <button
              onClick={handleRefresh}
              className="text-sm text-purple-600 hover:text-purple-700"
              disabled={statsLoading}
            >
              {statsLoading ? 'Aggiornamento...' : 'Aggiorna dati'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <QuickActions />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Contenuti Totali"
            value={stats?.overview.total || 0}
            change={stats?.trends.growthRate}
            changeLabel="vs 7 giorni fa"
            icon={<FileText className="w-6 h-6" />}
            loading={statsLoading}
          />
          <StatCard
            label="Pubblicati"
            value={stats?.overview.published || 0}
            icon={<CheckCircle className="w-6 h-6" />}
            loading={statsLoading}
          />
          <StatCard
            label="In Bozza"
            value={stats?.overview.draft || 0}
            icon={<Clock className="w-6 h-6" />}
            loading={statsLoading}
          />
          <StatCard
            label="Tasso Conversione"
            value={stats ? `${Math.round((stats.overview.published / Math.max(stats.overview.total, 1)) * 100)}%` : '0%'}
            icon={<TrendingUp className="w-6 h-6" />}
            loading={statsLoading}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-purple-100">Parole Generate</span>
            </div>
            <div className="text-3xl font-bold">
              {statsLoading ? '...' : (stats?.overview.totalWords || 0).toLocaleString('it-IT')}
            </div>
            <div className="text-sm text-purple-100 mt-1">
              {stats?.trends.last30Days.words || 0} negli ultimi 30 giorni
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Template Preferito</div>
            <div className="text-lg font-semibold text-gray-900">
              {statsLoading ? '...' : (stats?.overview.favoriteTemplate || 'Nessuno ancora')}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Tempo Medio Generazione</div>
            <div className="text-lg font-semibold text-gray-900">
              {statsLoading ? '...' : `${Math.round((stats?.overview.avgGenerationTime || 0) / 1000)}s`}
            </div>
          </div>
        </div>

        {/* Charts & Templates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ActivityChart 
            data={stats?.activity || []} 
            loading={statsLoading} 
          />
          <TemplateStats 
            templates={stats?.templates || []} 
            loading={statsLoading} 
          />
        </div>

        {/* Recent Posts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Contenuti Recenti</h2>
            <Link
              href="/"
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Vedi tutti →
            </Link>
          </div>
          <RecentPostsList posts={posts} loading={postsLoading} />
        </div>
      </main>
    </div>
  );
}
```

---

## 5. Quick Actions Component

Crea: `my-app/src/components/dashboard/QuickActions.tsx`

```typescript
'use client';

import Link from 'next/link';
import { CONTENT_TEMPLATES } from '@/lib/abacus';
import { Car, Brain, Users, Microscope, Camera, Sparkles, Mic2, GraduationCap } from 'lucide-react';

const templateIcons: Record<string, React.ReactNode> = {
  'on-the-road': <Car className="w-5 h-5" />,
  'wine-geek': <Brain className="w-5 h-5" />,
  'cin-cin-community': <Users className="w-5 h-5" />,
  'scienza-bite': <Microscope className="w-5 h-5" />,
  'behind-scenes': <Camera className="w-5 h-5" />,
  'new-discovery': <Sparkles className="w-5 h-5" />,
  'wine2wine': <Mic2 className="w-5 h-5" />,
  'via-academy': <GraduationCap className="w-5 h-5" />,
};

export function QuickActions() {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Rapidi</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(CONTENT_TEMPLATES).map(([key, template]) => (
          <Link
            key={key}
            href={`/?template=${key}`}
            className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center text-purple-600 mb-2 group-hover:scale-110 transition-transform">
              {templateIcons[key] || <Sparkles className="w-5 h-5" />}
            </div>
            <span className="text-xs text-center text-gray-600 group-hover:text-purple-600 transition-colors">
              {template.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## 6. Migrazione Dati Esistenti

### Script SQL per Popolare Campi Nuovi

```sql
-- Aggiornare posts esistenti con word_count stimato
UPDATE posts 
SET word_count = array_length(regexp_split_to_array(body_copy, '\s+'), 1)
WHERE word_count IS NULL AND body_copy IS NOT NULL;

-- Impostare platform default dove mancante
UPDATE posts SET platform = 'instagram' WHERE platform IS NULL;

-- Popolare user_stats per tutti gli utenti esistenti
INSERT INTO user_stats (user_id, total_posts, updated_at)
SELECT 
  user_id,
  COUNT(*),
  NOW()
FROM posts
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_posts = EXCLUDED.total_posts,
  updated_at = NOW();
```

---

## 7. Checklist Implementazione

### Giorno 1: Database & API
- [ ] Eseguire migration SQL
- [ ] Creare `/api/stats`
- [ ] Creare `/api/posts/recent`
- [ ] Aggiornare `/api/generate` con tracking
- [ ] Testare API con Postman/curl

### Giorno 2: Componenti UI
- [ ] Creare `useDashboardStats` hook
- [ ] Creare `useRecentPosts` hook
- [ ] Creare `StatCard` component
- [ ] Creare `ActivityChart` component
- [ ] Creare `TemplateStats` component
- [ ] Creare `RecentPostsList` component
- [ ] Creare `QuickActions` component

### Giorno 3: Integration & Polish
- [ ] Refactor `dashboard/page.tsx`
- [ ] Aggiungere loading states
- [ ] Aggiungere error handling
- [ ] Testare flusso completo
- [ ] Ottimizzare performance (React.memo, useMemo)
- [ ] Aggiungere empty states
- [ ] Responsive testing

---

## 8. Testing Checklist

```bash
# Test API
curl /api/stats # Dovrebbe restituire JSON con stats reali
curl /api/posts/recent?limit=5 # Dovrebbe restituire posts dell'utente

# Test Integrazione
1. Generare un nuovo post
2. Verificare che appaia nella dashboard
3. Verificare che le stats si aggiornino
4. Refresh pagina - i dati dovrebbero persistere

# Edge Cases
- Utente senza posts: mostrare empty state
- Errore API: mostrare retry button
- Loading lento: skeleton screens visibili
```

---

## 9. Metriche di Successo

Dopo l'implementazione, monitorare:

| Metrica | Target | Come Misurare |
|---------|--------|---------------|
| Time to first content | < 2s | `performance.now()` in page load |
| Stats accuracy | 100% | Confronto DB vs UI |
| Error rate | < 1% | Log errori in `/api/stats` |
| User engagement | +20% | Posts generati per sessione |

---

**Documento pronto per implementazione. Iniziare dal Giorno 1 - Database & API.**

Hai bisogno di chiarimenti su qualche sezione?