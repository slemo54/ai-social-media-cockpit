'use client';

import Link from 'next/link';
import { Clock, CheckCircle, Image as ImageIcon, FileText, ArrowUpRight } from 'lucide-react';

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
  instagram: 'bg-[#003366]/10 text-[#004A8F] border-[#003366]/30',
  linkedin: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/30',
  tiktok: 'bg-[#262626] text-[#FAFAFA] border-[#333333]',
  twitter: 'bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/30',
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
          <div key={i} className="dashboard-card p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-5 bg-[#1A1A1A] rounded"></div>
                <div className="w-full h-4 bg-[#1A1A1A] rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 dashboard-card">
        <div className="w-16 h-16 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#262626]">
          <FileText className="w-8 h-8 text-[#525252]" />
        </div>
        <h3 className="text-lg font-bold text-[#FAFAFA] mb-2">Nessun contenuto ancora</h3>
        <p className="text-[#737373] mb-5">Inizia generando il tuo primo post!</p>
        <Link
          href="/generate"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004A8F] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#003366]/30 transition-all"
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
          href={`/generate?edit=${post.id}`}
          className="block dashboard-card p-4 hover:border-[#003366]/50 transition-all group"
        >
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-[#003366]/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#003366]/20">
              {post.hasImage ? (
                <ImageIcon className="w-6 h-6 text-[#004A8F]" />
              ) : (
                <FileText className="w-6 h-6 text-[#004A8F]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-[#FAFAFA] truncate group-hover:text-[#004A8F] transition-colors">
                  {post.title}
                </h4>
                <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 border ${platformColors[post.platform] || 'bg-[#1A1A1A] text-[#737373] border-[#262626]'}`}>
                  {platformLabels[post.platform] || post.platform}
                </span>
              </div>

              <p className="text-sm text-[#737373] line-clamp-2 mb-2">{post.preview}</p>

              <div className="flex items-center gap-4 text-xs text-[#525252]">
                <span className="flex items-center gap-1.5">
                  {post.status === 'published' ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 font-medium">Pubblicato</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Bozza</span>
                    </>
                  )}
                </span>
                <span>{post.date}</span>
                <span>{post.wordCount} parole</span>
                {post.template && (
                  <span className="text-[#004A8F]">{post.template}</span>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-5 h-5 text-[#004A8F]" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
