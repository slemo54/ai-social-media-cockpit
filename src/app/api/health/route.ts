import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    
    // Test Supabase connection
    const { data: tables, error: tablesError } = await auth.supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query database',
        details: tablesError.message,
        code: tablesError.code,
      }, { status: 500 });
    }
    
    const tableNames = tables?.map(t => t.table_name) || [];
    const hasPostsTable = tableNames.includes('posts');
    
    // Try to query posts table structure
    let postsColumns = null;
    if (hasPostsTable) {
      const { data: columns, error: columnsError } = await auth.supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'posts')
        .eq('table_schema', 'public');
      
      if (!columnsError) {
        postsColumns = columns;
      }
    }
    
    return NextResponse.json({
      success: true,
      auth: {
        userId: auth.userId,
        isAnonymous: auth.isAnonymous,
      },
      database: {
        connected: true,
        tables: tableNames,
        hasPostsTable,
        postsColumns,
      },
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasAbacusKey: !!process.env.ABACUS_API_KEY,
        disableAuth: process.env.DISABLE_AUTH,
      },
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
