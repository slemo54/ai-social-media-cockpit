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
  instagram: 'bg-pink-100 text-pink-700',
  linkedin: 'bg-blue-100 text-blue-700',
  tiktok: 'bg-black text-white',
  twitter: 'bg-sky-100 text-sky-700',
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
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
                <div className="w-full h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun contenuto ancora</h3>
        <p className="text-gray-500 mb-4">Inizia generando il tuo primo post!</p>
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
          className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
        >
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {post.hasImage ? (
                <ImageIcon className="w-6 h-6 text-purple-500" />
              ) : (
                <FileText className="w-6 h-6 text-purple-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                  {post.title}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${platformColors[post.platform] || 'bg-gray-100 text-gray-600'}`}>
                  {platformLabels[post.platform] || post.platform}
                </span>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{post.preview}</p>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  {post.status === 'published' ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
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
                  <span className="text-purple-500">{post.template}</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
