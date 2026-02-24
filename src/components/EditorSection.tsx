'use client';

import { Post } from '@/types';

interface EditorSectionProps {
  post: Post | null;
  onUpdate: (updates: Partial<Post>) => void;
  onCopy: () => void;
  onDownload: () => void;
  onMarkPublished: () => void;
  onSelectTextProposal?: (index: number) => void;
}

export function EditorSection({
  post,
  onUpdate,
  onCopy,
  onSelectTextProposal,
}: EditorSectionProps) {
  if (!post) {
    return (
      <section className="flex flex-col gap-3 flex-1">
        <h3 className="text-slate-900 dark:text-white tracking-tight text-xl font-bold leading-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-gold" style={{ fontSize: '20px' }}>edit_note</span>
          Editor
        </h3>
        <div className="flex-1 min-h-[300px] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <span className="material-symbols-outlined text-[48px] mb-2 opacity-20">sparkles</span>
            <p className="text-sm">Genera un contenuto per iniziare ad editare</p>
          </div>
        </div>
      </section>
    );
  }

  const charCount = (post.title?.length || 0) + (post.body_copy?.length || 0) + (post.hashtags?.join(' ').length || 0);

  return (
    <section className="flex flex-col gap-3 flex-1">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 dark:text-white tracking-tight text-xl font-bold leading-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-gold" style={{ fontSize: '20px' }}>edit_note</span>
          Editor
        </h3>
        <div className="flex gap-2">
          {post.text_proposals && post.text_proposals.length > 1 && (
            <button
              onClick={() => {
                const nextIdx = ((post.selected_text_index || 0) + 1) % post.text_proposals!.length;
                onSelectTextProposal?.(nextIdx);
              }}
              className="p-2 text-slate-500 hover:text-primary dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Rigenera Testo (Prossima variante)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
            </button>
          )}
          <button
            onClick={onCopy}
            className="p-2 text-slate-500 hover:text-primary dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copia Testo"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>content_copy</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Title Field (Styled like Screen 2 but keep functional) */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Titolo / Hook</label>
          <input
            type="text"
            value={post.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full p-3 rounded-xl text-slate-900 dark:text-white bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-accent-gold/50 outline-none transition-all font-semibold"
          />
        </div>

        {/* Body Textarea */}
        <label className="flex flex-col relative group">
          <textarea
            value={post.body_copy || ''}
            onChange={(e) => onUpdate({ body_copy: e.target.value })}
            className="w-full h-full min-h-[240px] resize-y rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-gold/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 p-4 text-sm font-mono leading-relaxed transition-all shadow-sm"
            spellCheck="false"
          />
          <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-400 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
            {charCount} caratteri
          </div>
        </label>

        {/* Tags Area */}
        <div className="flex flex-wrap gap-2 mt-1">
          {post.hashtags?.map((tag, i) => (
            <span
              key={i}
              onClick={() => {
                const newHashtags = post.hashtags?.filter((_, index) => index !== i);
                onUpdate({ hashtags: newHashtags });
              }}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-400 cursor-pointer transition-colors"
            >
              {tag}
              <span className="material-symbols-outlined ml-1 opacity-50" style={{ fontSize: '14px' }}>close</span>
            </span>
          ))}
          <button
            onClick={() => {
              const tag = prompt('Inserisci nuovo tag (con #)');
              if (tag) {
                const newHashtags = [...(post.hashtags || []), tag.startsWith('#') ? tag : `#${tag}`];
                onUpdate({ hashtags: newHashtags });
              }
            }}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-slate-400 text-slate-500 hover:text-primary dark:hover:text-white hover:border-primary dark:hover:border-white transition-colors"
          >
            <span className="material-symbols-outlined mr-1" style={{ fontSize: '14px' }}>add</span> Aggiungi Tag
          </button>
        </div>
      </div>
    </section>
  );
}
