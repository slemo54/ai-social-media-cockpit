/* eslint-disable @next/next/no-img-element */
import { ImageIcon, Smartphone, Monitor, Square } from 'lucide-react';
import { Post, PreviewMode } from '@/types';

interface PreviewSectionProps {
  post: Post | null;
  previewMode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  isLoading: boolean;
}

const previewConfigs = {
  feed: {
    icon: Square,
    label: 'Feed',
    aspectRatio: 'aspect-square',
    containerClass: 'w-full max-w-sm',
  },
  story: {
    icon: Smartphone,
    label: 'Story',
    aspectRatio: 'aspect-[9/16]',
    containerClass: 'w-full max-w-[200px]',
  },
  linkedin: {
    icon: Monitor,
    label: 'LinkedIn',
    aspectRatio: 'aspect-[1.91/1]',
    containerClass: 'w-full max-w-md',
  },
};

export function PreviewSection({ post, previewMode, onModeChange, isLoading }: PreviewSectionProps) {
  const config = previewConfigs[previewMode];

  return (
    <div className="glass-card p-5 h-full flex flex-col animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Anteprima Visiva</h2>
      </div>

      {/* Toggle Buttons */}
      <div className="flex flex-col gap-2 mb-4 flex-shrink-0">
        {(Object.keys(previewConfigs) as PreviewMode[]).map((mode) => {
          const { icon: Icon, label } = previewConfigs[mode];
          const isActive = previewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? 'toggle-btn active text-white'
                  : 'toggle-btn text-white/60 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Image Preview */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`${config.containerClass} transition-all duration-300`}>
          <div className="phone-frame">
            <div
              className={`relative ${config.aspectRatio} bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl overflow-hidden`}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white/60 text-sm">Generazione...</p>
                  </div>
                </div>
              ) : post?.image_url ? (
                <img
                  src={post.image_url}
                  alt="Generated content"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/40">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Immagine apparirà qui</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Prompt Display */}
      {post?.image_prompt && (
        <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 flex-shrink-0">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-1">
            Prompt Immagine
          </p>
          <p className="text-sm text-white/70 italic line-clamp-2">&ldquo;{post.image_prompt}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
