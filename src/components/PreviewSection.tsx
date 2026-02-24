/* eslint-disable @next/next/no-img-element */
import { Post, PreviewMode } from '@/types';

interface PreviewSectionProps {
  post: Post | null;
  previewMode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  isLoading: boolean;
  onSelectImage?: (index: number) => void;
}

export function PreviewSection({ post, previewMode, onModeChange, isLoading, onSelectImage }: PreviewSectionProps) {
  const isIWA = post?.project === 'IWA';
  const selectedIndex = post?.selected_image_index ?? 0;
  const mainImage = post?.image_url;
  const proposals = post?.image_proposals;
  const hasProposals = proposals && proposals.length > 1;

  const platformLabel = {
    feed: 'Instagram Feed',
    story: 'Instagram Story',
    linkedin: 'LinkedIn Post',
  }[previewMode];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 dark:text-white tracking-tight text-xl font-bold leading-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-gold" style={{ fontSize: '20px' }}>preview</span>
          Anteprima
        </h3>
        <div className="flex bg-slate-100 dark:bg-surface-dark rounded-lg p-1 border border-slate-200 dark:border-border-dark">
          {(['feed', 'story', 'linkedin'] as PreviewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                previewMode === mode
                  ? 'bg-white dark:bg-slate-800 text-primary dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark transition-all">
        {/* Preview Image */}
        <div className={`relative w-full ${previewMode === 'story' ? 'aspect-[9/16] max-h-[400px]' : 'aspect-video'} bg-slate-100 dark:bg-slate-800 group overflow-hidden flex items-center justify-center`}>
          {isLoading ? (
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-xs">Generazione...</p>
            </div>
          ) : mainImage ? (
            <img src={mainImage} alt="Post" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-slate-300 dark:text-slate-600">
              <span className="material-symbols-outlined text-[48px] mb-2">image</span>
              <p className="text-xs">L&apos;immagine apparirà qui</p>
            </div>
          )}

          {mainImage && !isLoading && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
              Generato da AI
            </div>
          )}
        </div>

        {/* Preview Content */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-accent-gold uppercase tracking-wider">
            <span>{isIWA ? 'IWA' : 'IWP'} Post</span>
            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
            <span>{platformLabel}</span>
          </div>

          {post ? (
            <>
              <h4 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
                {post.title || 'Titolo del post'}
              </h4>
              <p className="text-slate-600 dark:text-[#9aabbc] text-sm leading-relaxed line-clamp-4">
                {post.body_copy || 'Il contenuto generato apparirà qui...'}
              </p>
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {post.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-primary dark:text-blue-400 font-medium">{tag}</span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3 animate-pulse"></div>
            </div>
          )}

          {/* CTA Simulation */}
          <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button className="w-full flex items-center justify-center h-10 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors pointer-events-none opacity-90">
              {isIWA ? 'Iscriviti Ora' : 'Ascolta Ora'}
            </button>
          </div>
        </div>

        {/* Image Proposals */}
        {hasProposals && !isLoading && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/10">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Scegli immagine alternativa</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scroll-container">
              {proposals.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectImage?.(idx)}
                  className={`relative flex-shrink-0 size-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedIndex ? 'border-accent-gold' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt={`Proposal ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
