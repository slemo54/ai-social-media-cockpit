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
