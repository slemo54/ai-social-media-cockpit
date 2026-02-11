import { NextResponse } from 'next/server';
import { getContentIntelligence } from '@/lib/content-intelligence';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = (searchParams.get('brand') || 'IWP') as 'IWP' | 'IWA';
  const platform = searchParams.get('platform') || 'instagram';

  try {
    const intelligence = await getContentIntelligence(brand, platform);

    return NextResponse.json({
      brand,
      platform,
      rulesCount: intelligence.voiceRules.length,
      categories: [...new Set(intelligence.voiceRules.map(r => r.category))],
      topHooks: intelligence.topHooks,
      topHashtags: intelligence.topHashtags,
      insightsCount: intelligence.engagementInsights.length,
      visualKeywords: intelligence.visualStyleKeywords,
      avoidPatterns: intelligence.avoidPatterns,
      hasData: intelligence.voiceRules.length > 0,
    });
  } catch (error) {
    console.error('[Intelligence] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch intelligence' }, { status: 500 });
  }
}
