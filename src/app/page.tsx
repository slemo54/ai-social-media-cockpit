'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { TemplateStats } from '@/components/dashboard/TemplateStats';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentPostsList } from '@/components/dashboard/RecentPostsList';
import { Wine, BarChart3, FileText, CheckCircle2, Clock, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback } from 'react';

export default function Home() {
  const { stats, loading: statsLoading, refresh: refreshStats } = useDashboardStats();
  const { posts, loading: postsLoading, refresh: refreshPosts } = useRecentPosts();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshStats(), refreshPosts()]);
    setRefreshing(false);
  }, [refreshStats, refreshPosts]);

  const loading = statsLoading || postsLoading;

  return (
    <main className="min-h-screen bg-[#0F0F0F]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#262626] bg-[#141414]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#003366] via-[#004A8F] to-[#C4A775] flex items-center justify-center shadow-lg shadow-[#003366]/20">
                <Wine className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#FAFAFA]">AI Social Cockpit</h1>
                <p className="text-xs text-[#737373]">Dashboard — IWP × IWA</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] rounded-xl text-[#A3A3A3] hover:text-[#FAFAFA] text-sm font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Aggiorna</span>
              </button>

              <Link
                href="/generate"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#003366] to-[#004A8F] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#003366]/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Nuovo Contenuto
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Totale Post"
            value={stats?.overview?.total || 0}
            icon={FileText}
            loading={loading}
            variant="header"
          />
          <StatCard
            label="Pubblicati"
            value={stats?.overview?.published || 0}
            icon={CheckCircle2}
            loading={loading}
            variant="level3"
          />
          <StatCard
            label="Bozze"
            value={stats?.overview?.draft || 0}
            icon={Clock}
            loading={loading}
            variant="champagne"
          />
          <StatCard
            label="Ultimi 7 Giorni"
            value={stats?.trends?.last7Days?.total || 0}
            change={stats?.trends?.last7Days?.total !== undefined && stats?.trends?.last30Days?.total ?
              Math.round((((stats.trends.last7Days.total as number) / Math.max((stats.trends.last30Days.total as number) / 4, 1)) - 1) * 100) :
              undefined}
            icon={TrendingUp}
            loading={loading}
            variant="level2"
          />
        </div>

        {/* Quick Actions Banner */}
        <div className="bg-gradient-to-br from-[#003366] to-[#004A8F] rounded-2xl p-6 text-white shadow-lg shadow-[#003366]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Crea Contenuto</h3>
              <p className="text-white/70 text-sm">Scegli un template per iniziare</p>
            </div>
          </div>
          <QuickActions />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Activity + Templates */}
          <div className="space-y-6">
            <ActivityChart
              data={stats?.activity || []}
              loading={loading}
            />
            <TemplateStats
              templates={stats?.templates || []}
              loading={loading}
            />
          </div>

          {/* Right Column: Recent Posts */}
          <div className="lg:col-span-2">
            <RecentPostsList posts={posts} loading={postsLoading} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#262626] bg-[#141414]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#525252]">
              by Anselmo Acquah — powered by Abacus API
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[#525252] text-xs">IWP × IWA</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8102E]"></span>
                <span className="w-2 h-2 rounded-full bg-[#003366]"></span>
                <span className="w-2 h-2 rounded-full bg-[#C4A775]"></span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
