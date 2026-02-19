-- Schema per AI Social Cockpit
-- Esegui questo script su Supabase SQL Editor

-- Tabella posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID,
  topic TEXT,
  title TEXT,
  body_copy TEXT,
  hashtags TEXT[],
  image_prompt TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  project TEXT CHECK (project IN ('IWP', 'IWA')),
  platform TEXT DEFAULT 'instagram',
  template_used TEXT,
  generation_time_ms INTEGER,
  word_count INTEGER,
  ai_model TEXT,
  prompt_length INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  copied_count INTEGER DEFAULT 0
);

-- Abilita Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy per permettere tutte le operazioni (quando DISABLE_AUTH=true)
-- ATTENZIONE: In produzione con auth abilitata, usa policy più restrittive
DROP POLICY IF EXISTS "Allow all operations" ON posts;
CREATE POLICY "Allow all operations" ON posts
  FOR ALL USING (true) WITH CHECK (true);

-- Tabella generation_logs
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  prompt_input TEXT,
  ai_model TEXT,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT
);

ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on logs" ON generation_logs;
CREATE POLICY "Allow all operations on logs" ON generation_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Crea storage bucket per le immagini (se non esiste)
-- Nota: Questo va fatto dall'interfaccia Supabase o con le API admin
-- Vai su Storage → New Bucket → nome: "social-images", Public: true

-- Tabella user_stats (cache statistiche)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY,
  total_posts INTEGER DEFAULT 0,
  published_posts INTEGER DEFAULT 0,
  draft_posts INTEGER DEFAULT 0,
  favorite_template TEXT,
  total_words_generated INTEGER DEFAULT 0,
  avg_generation_time_ms INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on user_stats" ON user_stats;
CREATE POLICY "Allow all operations on user_stats" ON user_stats
  FOR ALL USING (true) WITH CHECK (true);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_project ON posts(project);
