import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if both URL and key are provided
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function createPost(
  post: Partial<Post>,
  client?: SupabaseClient
): Promise<Post | null> {
  const sb = client ?? supabase;
  if (!sb) {
    console.warn('Supabase client not initialized');
    return null;
  }

  const { data, error } = await sb
    .from('posts')
    .insert([post])
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return null;
  }

  return data;
}

export async function updatePost(
  id: string,
  updates: Partial<Post>,
  client?: SupabaseClient
): Promise<Post | null> {
  const sb = client ?? supabase;
  if (!sb) {
    console.warn('Supabase client not initialized');
    return null;
  }

  const { data, error } = await sb
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating post:', error);
    return null;
  }

  return data;
}

export async function getPost(id: string, client?: SupabaseClient): Promise<Post | null> {
  const sb = client ?? supabase;
  if (!sb) {
    console.warn('Supabase client not initialized');
    return null;
  }

  const { data, error } = await sb
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }

  return data;
}

export async function getRecentPosts(
  limit: number = 10,
  client?: SupabaseClient
): Promise<Post[]> {
  const sb = client ?? supabase;
  if (!sb) {
    console.warn('Supabase client not initialized');
    return [];
  }

  const { data, error } = await sb
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }

  return data || [];
}

export async function uploadImageToStorage(
  imageData: string | Buffer,
  filename: string,
  client?: SupabaseClient
): Promise<string | null> {
  const sb = client ?? supabase;
  if (!sb) {
    throw new Error('Supabase client not initialized');
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'social-images';
  
  // Convert base64 to buffer if needed
  let fileBuffer: Buffer;
  let contentType = 'image/png';
  
  if (typeof imageData === 'string') {
    // Handle base64 data URL
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        fileBuffer = Buffer.from(matches[2], 'base64');
      } else {
        fileBuffer = Buffer.from(imageData, 'base64');
      }
    } else {
      // Handle URL - need to fetch it first
      const response = await fetch(imageData);
      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      contentType = response.headers.get('content-type') || 'image/png';
    }
  } else {
    fileBuffer = imageData;
  }

  const { data, error } = await sb.storage
    .from(bucket)
    .upload(`posts/${Date.now()}-${filename}`, fileBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  // Get public URL
  const { data: { publicUrl } } = sb.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}
