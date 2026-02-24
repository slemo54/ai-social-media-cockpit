'use client';

import { useRecentPosts } from '@/hooks/useRecentPosts';
import { RecentPostsList } from '@/components/dashboard/RecentPostsList';
import { QuickGenerationCard } from '@/components/dashboard/QuickGenerationCard';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

export default function Home() {
  const { posts, loading: postsLoading } = useRecentPosts();

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-border-dark">
        <div className="flex items-center gap-3">
          <div className="relative size-10 rounded-full overflow-hidden border border-slate-200 dark:border-border-dark bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA99RCyUC5pGY6Xsjf4bhlJUsUUDEJI0rGKjWpSlDwhOt_hj3I1SSLt2wUde5bUPqxa7rRI8xz76Ab_KoHKXCTwf2EGgO_CGtXzO_K8hGGTBJ58vNUDxgybYp9B2lJXCimqm-Aumgxjn4-vbl2zcZ1_A8I66hORShMPaVUdI3oEO6gV22KxHZcyskqkzcnKRurJuDIuysklKAHEYM-lm4THuM3OSiWj7IrNKGPAICfhJaZwqG-GpGIoCJBGVL2lSn-bfgsa26hjUvtU')" }}
            ></div>
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">AI Social Cockpit</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bentornato, Admin</p>
          </div>
        </div>
        <button className="flex items-center justify-center size-10 rounded-full hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 p-4 pb-24 max-w-2xl mx-auto w-full">
        {/* Quick Generation */}
        <QuickGenerationCard />

        {/* Recent Contents */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contenuti Recenti</h3>
            <Link href="/posts" className="text-sm font-medium text-primary dark:text-blue-400 hover:underline">
              Vedi tutti
            </Link>
          </div>

          <RecentPostsList posts={posts} loading={postsLoading} />
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
