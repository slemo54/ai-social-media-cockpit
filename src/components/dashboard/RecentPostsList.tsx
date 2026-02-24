'use client';

import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  preview: string;
  status: 'draft' | 'published';
  platform: string;
  template: string;
  date: string;
  hasImage: boolean;
  wordCount: number;
  project?: string;
}

interface RecentPostsListProps {
  posts: Post[];
  loading?: boolean;
}

export function RecentPostsList({ posts, loading }: RecentPostsListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark animate-pulse">
            <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0"></div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark">
        <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-700 mb-2">description</span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Nessun contenuto</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Inizia generando il tuo primo post!</p>
      </div>
    );
  }

  const getIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'podcast': return 'podcasts';
      case 'instagram': return 'image';
      case 'linkedin': return 'description';
      default: return 'description';
    }
  };

  const getIconBg = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'podcast': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
      case 'instagram': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      default: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/generate?edit=${post.id}`}
          className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark active:bg-slate-50 dark:active:bg-[#202020] transition-colors cursor-pointer group"
        >
          <div className={`size-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconBg(post.platform)}`}>
            <span className="material-symbols-outlined">{getIcon(post.platform)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
              {post.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {post.project || 'IWA'} • {post.platform}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
              post.status === 'published'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            }`}>
              {post.status === 'published' ? 'Pronto' : 'Bozza'}
            </span>
            <span className="text-[10px] text-slate-400">{post.date}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
