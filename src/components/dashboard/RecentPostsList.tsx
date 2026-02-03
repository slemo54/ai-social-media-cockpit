'use client';

import Link from 'next/link';
import { Clock, CheckCircle, Image as ImageIcon, FileText } from 'lucide-react';

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
}

interface RecentPostsListProps {
  posts: Post[];
  loading?: boolean;
}

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/20 text-pink-300',
  linkedin: 'bg-blue-500/20 text-blue-300',
  tiktok: 'bg-black/50 text-white',
  twitter: 'bg-sky-500/20 text-sky-300',
};

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'X/Twitter',
};

export function RecentPostsList({ posts, loading }: RecentPostsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-5 bg-white/10 rounded"></div>
                <div className="w-full h-4 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white/40" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Nessun contenuto ancora</h3>
        <p className="text-white/50 mb-4">Inizia generando il tuo primo post!</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
        >
          Genera il primo post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/?edit=${post.id}`}
          className="block bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group"
        >
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              {post.hasImage ? (
                <ImageIcon className="w-6 h-6 text-purple-400" />
              ) : (
                <FileText className="w-6 h-6 text-purple-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                  {post.title}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${platformColors[post.platform] || 'bg-white/10 text-white/60'}`}>
                  {platformLabels[post.platform] || post.platform}
                </span>
              </div>

              <p className="text-sm text-white/50 line-clamp-2 mb-2">{post.preview}</p>

              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  {post.status === 'published' ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Pubblicato</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" />
                      <span>Bozza</span>
                    </>
                  )}
                </span>
                <span>{post.date}</span>
                <span>{post.wordCount} parole</span>
                {post.template && (
                  <span className="text-purple-400">{post.template}</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
