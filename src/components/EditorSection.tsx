'use client';

import { Copy, Download, CheckCircle, Edit3, Hash, Type, Sparkles, Share2 } from 'lucide-react';
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
      <div className="dashboard-card p-6 h-full flex flex-col animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-4 mb-5 flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5C2D91] to-[#7B4FB0] flex items-center justify-center shadow-lg shadow-[#5C2D91]/20">
            <Edit3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">Editor Testo</h2>
            <p className="text-xs text-[#737373]">Modifica e perfeziona il contenuto</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-[#525252] min-h-0">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#262626]">
              <Sparkles className="w-10 h-10 text-[#5C2D91]" />
            </div>
            <p className="text-[#737373]">Genera un contenuto per iniziare ad editare</p>
          </div>
        </div>
      </div>
    );
  }

  const fullText = `${post.title}\n\n${post.body_copy}\n\n${post.hashtags?.join(' ')}`;

  return (
    <div className="dashboard-card p-6 h-full flex flex-col animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5C2D91] to-[#7B4FB0] flex items-center justify-center shadow-lg shadow-[#5C2D91]/20">
            <Edit3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">Editor Testo</h2>
            <p className="text-xs text-[#737373]">Modifica e perfeziona il contenuto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              post.status === 'published'
                ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                : 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
            }`}
          >
            {post.status === 'published' ? '✓ Pubblicato' : 'Bozza'}
          </span>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-1 scroll-container">
        {/* Title Field */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#A3A3A3] mb-2">
            <Type className="w-4 h-4 text-[#5C2D91]" />
            Titolo (Hook)
          </label>
          <input
            type="text"
            value={post.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="dashboard-input w-full"
            placeholder="Inserisci il titolo..."
          />
        </div>

        {/* Body Copy Field */}
        <div>
          <label className="text-sm font-semibold text-[#A3A3A3] mb-2 block">
            Testo del Post
          </label>
          <textarea
            value={post.body_copy || ''}
            onChange={(e) => onUpdate({ body_copy: e.target.value })}
            className="dashboard-input w-full h-36 resize-none"
            placeholder="Inserisci il testo del post..."
          />
        </div>

        {/* Hashtags Field */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#A3A3A3] mb-2">
            <Hash className="w-4 h-4 text-[#D4AF37]" />
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
            className="dashboard-input w-full"
            placeholder="#hashtag1 #hashtag2 #hashtag3"
          />
        </div>

        {/* Full Text Preview */}
        <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#262626]">
          <p className="text-xs font-semibold text-[#525252] uppercase tracking-wider mb-2">
            Anteprima Completa
          </p>
          <pre className="text-sm text-[#A3A3A3] whitespace-pre-wrap font-sans line-clamp-4">{fullText}</pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 grid grid-cols-4 gap-3 flex-shrink-0">
        <button
          onClick={onCopy}
          className="flex flex-col items-center justify-center gap-1.5 p-3 bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] hover:border-[#333333] rounded-xl transition-all group"
          title="Copia testo"
        >
          <Copy className="w-5 h-5 text-[#737373] group-hover:text-[#5C2D91] transition-colors" />
          <span className="text-xs text-[#525252] group-hover:text-[#A3A3A3]">Copia</span>
        </button>
        
        <button
          onClick={onDownload}
          disabled={!post.image_url}
          className="flex flex-col items-center justify-center gap-1.5 p-3 bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] hover:border-[#333333] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          title="Scarica immagine"
        >
          <Download className="w-5 h-5 text-[#737373] group-hover:text-[#7B4FB0] transition-colors" />
          <span className="text-xs text-[#525252] group-hover:text-[#A3A3A3]">Scarica</span>
        </button>
        
        <button
          onClick={onMarkPublished}
          disabled={post.status === 'published'}
          className="flex flex-col items-center justify-center gap-1.5 p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          title="Marca come pubblicato"
        >
          <CheckCircle className="w-5 h-5 text-green-400 group-hover:text-green-300" />
          <span className="text-xs text-green-400">
            {post.status === 'published' ? 'Fatto' : 'Pubblica'}
          </span>
        </button>
        
        <button
          onClick={() => navigator.share?.({
            title: post.title || '',
            text: fullText,
          }).catch(() => {})}
          className="flex flex-col items-center justify-center gap-1.5 p-3 bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] hover:border-[#333333] rounded-xl transition-all group"
          title="Condividi"
        >
          <Share2 className="w-5 h-5 text-[#737373] group-hover:text-[#D4AF37] transition-colors" />
          <span className="text-xs text-[#525252] group-hover:text-[#A3A3A3]">Share</span>
        </button>
      </div>
    </div>
  );
}
