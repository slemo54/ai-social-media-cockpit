'use client';

import { Copy, Download, CheckCircle, Edit3, Hash, Type, Sparkles, RefreshCw, Share2 } from 'lucide-react';
import { Post } from '@/types';

interface EditorSectionProps {
  post: Post | null;
  onUpdate: (updates: Partial<Post>) => void;
  onCopy: () => void;
  onDownload: () => void;
  onMarkPublished: () => void;
}

export function EditorSection({
  post,
  onUpdate,
  onCopy,
  onDownload,
  onMarkPublished,
}: EditorSectionProps) {
  if (!post) {
    return (
      <div className="glass-card p-5 h-full flex flex-col animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Editor Testo</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-white/40 min-h-0">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Genera un contenuto per iniziare ad editare</p>
          </div>
        </div>
      </div>
    );
  }

  const fullText = `${post.title}\n\n${post.body_copy}\n\n${post.hashtags?.join(' ')}`;

  return (
    <div className="glass-card p-5 h-full flex flex-col animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Editor Testo</h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              post.status === 'published'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            {post.status === 'published' ? 'Pubblicato' : 'Bozza'}
          </span>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-1">
        {/* Title Field */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
            <Type className="w-4 h-4" />
            Titolo (Hook)
          </label>
          <input
            type="text"
            value={post.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="glass-input w-full px-4 py-3"
            placeholder="Inserisci il titolo..."
          />
        </div>

        {/* Body Copy Field */}
        <div>
          <label className="text-sm font-medium text-white/70 mb-2 block">
            Testo del Post
          </label>
          <textarea
            value={post.body_copy || ''}
            onChange={(e) => onUpdate({ body_copy: e.target.value })}
            className="glass-input w-full h-32 px-4 py-3 resize-none"
            placeholder="Inserisci il testo del post..."
          />
        </div>

        {/* Hashtags Field */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
            <Hash className="w-4 h-4" />
            Hashtags
          </label>
          <input
            type="text"
            value={post.hashtags?.join(' ') || ''}
            onChange={(e) =>
              onUpdate({
                hashtags: e.target.value.split(/\s+/).filter((h) => h.startsWith('#') || h.length > 0),
              })
            }
            className="glass-input w-full px-4 py-3"
            placeholder="#hashtag1 #hashtag2 #hashtag3"
          />
        </div>

        {/* Full Text Preview */}
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">
            Anteprima Completa
          </p>
          <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans line-clamp-4">{fullText}</pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-4 gap-2 flex-shrink-0">
        <button
          onClick={onCopy}
          className="flex flex-col items-center justify-center gap-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
          title="Copia testo"
        >
          <Copy className="w-5 h-5 text-white/80" />
          <span className="text-xs text-white/60">Copia</span>
        </button>
        <button
          onClick={onDownload}
          disabled={!post.image_url}
          className="flex flex-col items-center justify-center gap-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors disabled:opacity-50"
          title="Scarica immagine"
        >
          <Download className="w-5 h-5 text-white/80" />
          <span className="text-xs text-white/60">Scarica</span>
        </button>
        <button
          onClick={onMarkPublished}
          disabled={post.status === 'published'}
          className="flex flex-col items-center justify-center gap-1 p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl transition-colors disabled:opacity-50"
          title="Marca come pubblicato"
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-xs text-green-400/80">
            {post.status === 'published' ? 'Fatto' : 'Pubblica'}
          </span>
        </button>
        <button
          onClick={() => navigator.share?.({
            title: post.title || '',
            text: fullText,
          }).catch(() => {})}
          className="flex flex-col items-center justify-center gap-1 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
          title="Condividi"
        >
          <Share2 className="w-5 h-5 text-white/80" />
          <span className="text-xs text-white/60">Share</span>
        </button>
      </div>
    </div>
  );
}
