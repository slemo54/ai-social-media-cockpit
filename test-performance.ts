import { NextResponse } from 'next/server';

// Mock dependencies
const mockSupabase = {
  from: (table: string) => ({
    select: (fields: string) => ({
      eq: (field: string, val: any) => ({
        maybeSingle: async () => {
          await new Promise(r => setTimeout(r, 100)); // Simulate 100ms DB delay
          return { data: { total_posts: 10, published_posts: 5 } };
        }
      }),
      gte: (field: string, val: any) => ({
        order: async () => {
          await new Promise(r => setTimeout(r, 100)); // Simulate 100ms DB delay
          return { data: [
            { status: 'published', created_at: new Date().toISOString(), word_count: 100 },
            { status: 'draft', created_at: new Date().toISOString(), word_count: 50 }
          ]};
        }
      })
    })
  })
};

// Current Implementation (Sequential)
async function currentImplementation() {
  const start = performance.now();

  let cachedStats = null;
  try {
    const { data } = await mockSupabase
      .from('user_stats')
      .select('*')
      .eq('user_id', 'test')
      .maybeSingle();
    cachedStats = data;
  } catch {}

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let recentPosts: any[] = [];
  try {
    const { data } = await mockSupabase
      .from('posts')
      .select('status, created_at, word_count, template_used, user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    recentPosts = data || [];
  } catch {}

  const end = performance.now();
  return end - start;
}

// Optimized Implementation (Concurrent)
async function optimizedImplementation() {
  const start = performance.now();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [statsResult, postsResult] = await Promise.allSettled([
    mockSupabase
      .from('user_stats')
      .select('*')
      .eq('user_id', 'test')
      .maybeSingle(),
    mockSupabase
      .from('posts')
      .select('status, created_at, word_count, template_used, user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
  ]);

  const cachedStats = statsResult.status === 'fulfilled' ? statsResult.value.data : null;
  const recentPosts = postsResult.status === 'fulfilled' ? (postsResult.value.data || []) : [];

  const end = performance.now();
  return end - start;
}

async function runTest() {
  console.log('Running benchmarks...');

  let currentTotal = 0;
  for (let i = 0; i < 5; i++) {
    currentTotal += await currentImplementation();
  }
  const currentAvg = currentTotal / 5;
  console.log(`Current (Sequential) Average: ${currentAvg.toFixed(2)}ms`);

  let optimizedTotal = 0;
  for (let i = 0; i < 5; i++) {
    optimizedTotal += await optimizedImplementation();
  }
  const optimizedAvg = optimizedTotal / 5;
  console.log(`Optimized (Concurrent) Average: ${optimizedAvg.toFixed(2)}ms`);

  console.log(`Improvement: ${(((currentAvg - optimizedAvg) / currentAvg) * 100).toFixed(2)}%`);
}

runTest();
