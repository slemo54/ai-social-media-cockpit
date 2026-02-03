'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { TemplateStats } from '@/components/dashboard/TemplateStats';
import { RecentPostsList } from '@/components/dashboard/RecentPostsList';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { FileText, CheckCircle, Clock, TrendingUp, Sparkles, LayoutDashboard } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Errore nel caricamento dei dati</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-xs text-white/50">IWP × IWA Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                disabled={statsLoading}
              >
                {statsLoading ? 'Aggiornamento...' : 'Aggiorna dati'}
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Nuovo Contenuto
              </Link>
            </div>
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
            icon={FileText}
            loading={statsLoading}
          />
          <StatCard
            label="Pubblicati"
            value={stats?.overview.published || 0}
            icon={CheckCircle}
            loading={statsLoading}
          />
          <StatCard
            label="In Bozza"
            value={stats?.overview.draft || 0}
            icon={Clock}
            loading={statsLoading}
          />
          <StatCard
            label="Tasso Conversione"
            value={stats ? `${Math.round((stats.overview.published / Math.max(stats.overview.total, 1)) * 100)}%` : '0%'}
            icon={TrendingUp}
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

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="text-sm text-white/60 mb-1">Template Preferito</div>
            <div className="text-lg font-semibold text-white">
              {statsLoading ? '...' : (stats?.overview.favoriteTemplate || 'Nessuno ancora')}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="text-sm text-white/60 mb-1">Tempo Medio Generazione</div>
            <div className="text-lg font-semibold text-white">
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
            <h2 className="text-xl font-semibold text-white">Contenuti Recenti</h2>
            <Link
              href="/"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
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
