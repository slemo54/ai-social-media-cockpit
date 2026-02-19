'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { TemplateStats } from '@/components/dashboard/TemplateStats';
import { RecentPostsList } from '@/components/dashboard/RecentPostsList';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { FileText, CheckCircle, Clock, TrendingUp, Sparkles, LayoutDashboard, Wine, ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#C8102E]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#C8102E]/30">
            <Sparkles className="w-10 h-10 text-[#C8102E]" />
          </div>
          <p className="text-red-400 mb-4">Errore nel caricamento dei dati</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gradient-to-r from-[#5C2D91] to-[#7B4FB0] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#5C2D91]/30 transition-all"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Header */}
      <header className="bg-[#141414] border-b border-[#262626] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-[#737373] hover:text-[#FAFAFA] hover:border-[#333333] transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C2D91] via-[#7B4FB0] to-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#5C2D91]/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#FAFAFA]">Dashboard</h1>
                <p className="text-xs text-[#737373]">IWP × IWA Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="text-sm text-[#7B4FB0] hover:text-[#9B7FD0] transition-colors font-medium"
                disabled={statsLoading}
              >
                {statsLoading ? 'Aggiornamento...' : 'Aggiorna dati'}
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5C2D91] to-[#7B4FB0] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#5C2D91]/30 transition-all"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            label="Contenuti Totali"
            value={stats?.overview.total || 0}
            change={stats?.trends.growthRate}
            changeLabel="vs 7 giorni fa"
            icon={FileText}
            loading={statsLoading}
            variant="header"
          />
          <StatCard
            label="Pubblicati"
            value={stats?.overview.published || 0}
            icon={CheckCircle}
            loading={statsLoading}
            variant="green"
          />
          <StatCard
            label="In Bozza"
            value={stats?.overview.draft || 0}
            icon={Clock}
            loading={statsLoading}
            variant="gold"
          />
          <StatCard
            label="Tasso Conversione"
            value={stats ? `${Math.round((stats.overview.published / Math.max(stats.overview.total, 1)) * 100)}%` : '0%'}
            icon={TrendingUp}
            loading={statsLoading}
            variant="red"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-gradient-to-br from-[#5C2D91] to-[#7B4FB0] rounded-2xl p-6 text-white shadow-lg shadow-[#5C2D91]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-white/80 text-sm font-medium">Parole Generate</span>
            </div>
            <div className="text-4xl font-bold">
              {statsLoading ? '...' : (stats?.overview.totalWords || 0).toLocaleString('it-IT')}
            </div>
            <div className="text-sm text-white/70 mt-2">
              {stats?.trends.last30Days.words || 0} negli ultimi 30 giorni
            </div>
          </div>

          <div className="dashboard-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
                <Wine className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <span className="text-[#737373] text-sm font-medium">Template Preferito</span>
            </div>
            <div className="text-xl font-bold text-[#FAFAFA]">
              {statsLoading ? '...' : (stats?.overview.favoriteTemplate || 'Nessuno ancora')}
            </div>
          </div>

          <div className="dashboard-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#C8102E]/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#C8102E]" />
              </div>
              <span className="text-[#737373] text-sm font-medium">Tempo Medio</span>
            </div>
            <div className="text-xl font-bold text-[#FAFAFA]">
              {statsLoading ? '...' : `${Math.round((stats?.overview.avgGenerationTime || 0) / 1000)}s`}
            </div>
          </div>
        </div>

        {/* Charts & Templates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
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
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#FAFAFA]">Contenuti Recenti</h2>
            <Link
              href="/"
              className="text-sm text-[#7B4FB0] hover:text-[#9B7FD0] transition-colors font-medium"
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
