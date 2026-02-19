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
  instagram: 'bg-pink-50 text-pink-600',
  linkedin: 'bg-blue-50 text-blue-600',
  tiktok: 'bg-gray-100 text-gray-700',
  twitter: 'bg-sky-50 text-sky-600',
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
          <div key={i} className="bg-white p-4 rounded-xl border border-[#E8E0D8] animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-[#F5EFE7] rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-5 bg-[#F5EFE7] rounded"></div>
                <div className="w-full h-4 bg-[#F5EFE7] rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-[#E8E0D8]">
        <div className="w-16 h-16 bg-[#F5EFE7] rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[#C4B8AD]" />
        </div>
        <h3 className="text-lg font-medium text-[#2D2D2D] mb-2">Nessun contenuto ancora</h3>
        <p className="text-[#9B8E82] mb-4">Inizia generando il tuo primo post!</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#C8956C] to-[#D4AF37] text-white rounded-lg hover:opacity-90 transition-colors"
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
          className="block bg-white p-4 rounded-xl border border-[#E8E0D8] hover:shadow-md transition-all group"
        >
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-[#C8956C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              {post.hasImage ? (
                <ImageIcon className="w-6 h-6 text-[#C8956C]" />
              ) : (
                <FileText className="w-6 h-6 text-[#C8956C]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-[#2D2D2D] truncate group-hover:text-[#C8956C] transition-colors">
                  {post.title}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${platformColors[post.platform] || 'bg-[#F5EFE7] text-[#6B5E52]'}`}>
                  {platformLabels[post.platform] || post.platform}
                </span>
              </div>

              <p className="text-sm text-[#9B8E82] line-clamp-2 mb-2">{post.preview}</p>

              <div className="flex items-center gap-4 text-xs text-[#C4B8AD]">
                <span className="flex items-center gap-1">
                  {post.status === 'published' ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">Pubblicato</span>
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
                  <span className="text-[#C8956C]">{post.template}</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
