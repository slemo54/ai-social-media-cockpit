import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface VoiceRule {
  category: string;
  rule_name: string;
  rule_description: string;
  examples: string[];
  confidence: number;
}

interface EngagementInsight {
  pattern_type: string;
  pattern_value: any;
  avg_engagement_score: number;
}

interface ContentIntelligence {
  voiceRules: VoiceRule[];
  topHooks: string[];
  topHashtags: string[];
  engagementInsights: EngagementInsight[];
  visualStyleKeywords: string[];
  avoidPatterns: string[];
}

// In-memory cache (5 minutes)
let cache: { data: ContentIntelligence; brand: string; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function getSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getContentIntelligence(
  brand: 'IWP' | 'IWA',
  platform: string = 'instagram'
): Promise<ContentIntelligence> {
  // Check cache
  if (cache && cache.brand === brand && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const supabase = getSupabaseClient();

  // Fetch active voice rules ordered by confidence
  const { data: rules } = await supabase
    .from('brand_voice_rules')
    .select('category, rule_name, rule_description, examples, confidence')
    .eq('brand', brand)
    .eq('active', true)
    .order('confidence', { ascending: false });

  // Fetch engagement patterns
  const { data: patterns } = await supabase
    .from('engagement_patterns')
    .select('pattern_type, pattern_value, avg_engagement_score')
    .eq('brand', brand)
    .eq('platform', platform)
    .order('avg_engagement_score', { ascending: false })
    .limit(15);

  // Fetch visual style keywords
  const { data: visualStyles } = await supabase
    .from('visual_style_patterns')
    .select('prompt_keywords, engagement_correlation')
    .eq('brand', brand)
    .order('engagement_correlation', { ascending: false })
    .limit(10);

  // Fetch top posts for hooks and hashtags
  const { data: topPosts } = await supabase
    .from('content_intelligence_posts')
    .select('post_text, hashtags')
    .eq('brand', brand)
    .order('engagement_score', { ascending: false })
    .limit(10);

  const voiceRules = (rules || []) as VoiceRule[];

  const intelligence: ContentIntelligence = {
    voiceRules,
    topHooks: extractHooks(topPosts || []),
    topHashtags: extractTopHashtags(topPosts || []),
    engagementInsights: (patterns || []) as EngagementInsight[],
    visualStyleKeywords: (visualStyles || []).flatMap((s: any) => s.prompt_keywords || []),
    avoidPatterns: voiceRules
      .filter(r => r.category === 'avoid')
      .map(r => r.rule_description),
  };

  // Update cache
  cache = { data: intelligence, brand, timestamp: Date.now() };

  return intelligence;
}

function extractHooks(posts: any[]): string[] {
  return posts
    .map(p => p.post_text?.split('\n')[0] || '')
    .filter((h: string) => h.length > 10)
    .slice(0, 5);
}

function extractTopHashtags(posts: any[]): string[] {
  const counts: Record<string, number> = {};
  posts.forEach(p => {
    (p.hashtags || []).forEach((h: string) => {
      counts[h] = (counts[h] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);
}

export function buildPromptEnhancement(intelligence: ContentIntelligence): string {
  const sections: string[] = [];

  // Tone rules
  const toneRules = intelligence.voiceRules.filter(r => r.category === 'tone');
  if (toneRules.length > 0) {
    sections.push(`REGOLE DI TONO (data-driven):\n${
      toneRules.map(r => `- ${r.rule_description}${r.examples?.length > 0 ? ` (es: "${r.examples[0]}")` : ''}`).join('\n')
    }`);
  }

  // Hook patterns
  const hookRules = intelligence.voiceRules.filter(r => r.category === 'hooks');
  if (hookRules.length > 0) {
    sections.push(`HOOK PATTERNS (alto engagement):\n${
      hookRules.map(r => `- ${r.rule_description}${r.examples?.length > 0 ? `\n  Esempi: ${r.examples.slice(0, 2).map(e => `"${e}"`).join(', ')}` : ''}`).join('\n')
    }`);
  }

  // Real hooks from top posts
  if (intelligence.topHooks.length > 0) {
    sections.push(`HOOK DAI POST PIU PERFORMANTI:\n${
      intelligence.topHooks.map(h => `- "${h}"`).join('\n')
    }`);
  }

  // Vocabulary
  const vocabRules = intelligence.voiceRules.filter(r => r.category === 'vocabulary');
  if (vocabRules.length > 0) {
    sections.push(`VOCABOLARIO BRAND:\n${
      vocabRules.map(r => `- ${r.rule_description}: ${(r.examples || []).slice(0, 4).join(', ')}`).join('\n')
    }`);
  }

  // Structure
  const structRules = intelligence.voiceRules.filter(r => r.category === 'structure');
  if (structRules.length > 0) {
    sections.push(`STRUTTURA POST:\n${
      structRules.map(r => `- ${r.rule_description}`).join('\n')
    }`);
  }

  // Closings
  const closingRules = intelligence.voiceRules.filter(r => r.category === 'closings');
  if (closingRules.length > 0) {
    sections.push(`CHIUSURE:\n${
      closingRules.map(r => `- ${r.rule_description}${r.examples?.length > 0 ? ` (es: "${r.examples[0]}")` : ''}`).join('\n')
    }`);
  }

  // Top hashtags from real data
  if (intelligence.topHashtags.length > 0) {
    sections.push(`HASHTAG TOP (da post reali): ${intelligence.topHashtags.join(', ')}`);
  }

  // What to avoid
  if (intelligence.avoidPatterns.length > 0) {
    sections.push(`DA EVITARE ASSOLUTAMENTE:\n${
      intelligence.avoidPatterns.map(p => `- ❌ ${p}`).join('\n')
    }`);
  }

  return sections.join('\n\n');
}

export function buildImagePromptEnhancement(intelligence: ContentIntelligence): string {
  if (intelligence.visualStyleKeywords.length === 0) {
    return '';
  }
  return intelligence.visualStyleKeywords.join(', ');
}
