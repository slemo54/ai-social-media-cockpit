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
