/* eslint-disable @next/next/no-img-element */
import { ImageIcon, Smartphone, Monitor, Square, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Post, PreviewMode } from '@/types';

interface PreviewSectionProps {
  post: Post | null;
  previewMode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  isLoading: boolean;
  onSelectImage?: (index: number) => void;
}

const previewConfigs = {
  feed: {
    icon: Square,
    label: 'Feed',
  },
  story: {
    icon: Smartphone,
    label: 'Story',
  },
  linkedin: {
    icon: Monitor,
    label: 'LinkedIn',
  },
};

function getProfileInfo(post: Post | null) {
  const isIWA = post?.project === 'IWA';
  return {
    username: isIWA ? 'itawineacademy' : 'italianwinepodcast',
    displayName: isIWA ? 'Italian Wine Academy' : 'Italian Wine Podcast',
    avatarBg: isIWA ? 'bg-gradient-to-br from-[#003366] to-[#004A8F]' : 'bg-gradient-to-br from-[#CD212A] to-[#E53935]',
    avatarLetter: isIWA ? 'A' : 'P',
  };
}

function InstagramFeedPreview({ post, isLoading, onSelectImage }: { post: Post | null; isLoading: boolean; onSelectImage?: (index: number) => void }) {
  const profile = getProfileInfo(post);
  const proposals = post?.image_proposals;
  const hasProposals = proposals && proposals.length > 1;
  const selectedIndex = post?.selected_image_index ?? 0;
  const mainImage = post?.image_url;

  return (
    <div className="w-full max-w-[340px] bg-[#1A1A1A] rounded-2xl border border-[#262626] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${profile.avatarBg} flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#003366] ring-offset-2 ring-offset-[#1A1A1A]`}>
            {profile.avatarLetter}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#FAFAFA] leading-tight">{profile.username}</p>
            <p className="text-[11px] text-[#737373]">Sponsored</p>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-[#737373]" />
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-[#0F0F0F]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#525252] text-xs">Generazione...</p>
            </div>
          </div>
        ) : mainImage ? (
          <img src={mainImage} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#333333]">
            <div className="text-center">
              <ImageIcon className="w-14 h-14 mx-auto mb-2 opacity-30" />
              <p className="text-xs text-[#525252]">Immagine apparirà qui</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-[#FAFAFA] cursor-pointer hover:text-[#CD212A] transition-colors" />
            <MessageCircle className="w-6 h-6 text-[#FAFAFA] cursor-pointer hover:text-[#003366] transition-colors" />
            <Send className="w-6 h-6 text-[#FAFAFA] cursor-pointer hover:text-[#C4A775] transition-colors" />
          </div>
          <Bookmark className="w-6 h-6 text-[#FAFAFA] cursor-pointer hover:text-[#D4AF37] transition-colors" />
        </div>

        {/* Likes */}
        <p className="text-[13px] font-semibold text-[#FAFAFA] mb-2">
          Liked by <span className="font-bold">wine_lover</span> and <span className="font-bold">others</span>
        </p>

        {/* Caption */}
        {post && (
          <div className="mb-2">
            <p className="text-[13px] text-[#FAFAFA] leading-snug">
              <span className="font-semibold">{profile.username}</span>{' '}
              {post.title && <span className="font-medium">{post.title} </span>}
              {post.body_copy && (
                <span className="text-[#A3A3A3]">
                  {post.body_copy.length > 120 ? post.body_copy.substring(0, 120) + '...' : post.body_copy}
                </span>
              )}
            </p>
            {post.hashtags && post.hashtags.length > 0 && (
              <p className="text-[13px] text-[#003366] mt-1">
                {post.hashtags.slice(0, 5).join(' ')}
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[11px] text-[#525252] uppercase tracking-wide pb-2">Just now</p>
      </div>

      {/* Image Proposals */}
      {hasProposals && (
        <div className="border-t border-[#262626] px-4 py-3">
          <p className="text-[11px] font-semibold text-[#525252] uppercase tracking-wider mb-3">Scegli immagine</p>
          <div className="grid grid-cols-3 gap-2">
            {proposals.map((url, idx) => (
              <button
                key={idx}
                onClick={() => onSelectImage?.(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${idx === selectedIndex
                    ? 'border-[#003366] shadow-lg shadow-[#003366]/30 scale-[1.02]'
                    : 'border-transparent hover:border-[#333333]'
                  }`}
              >
                <img src={url} alt={`Proposal ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === selectedIndex && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#003366] rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StoryPreview({ post, isLoading }: { post: Post | null; isLoading: boolean }) {
  const profile = getProfileInfo(post);
  const mainImage = post?.image_url;

  return (
    <div className="w-full max-w-[200px]">
      {/* Phone Frame */}
      <div className="relative aspect-[9/16] bg-black rounded-[32px] overflow-hidden border-2 border-[#262626] shadow-2xl">
        {/* Story image */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F]">
            <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mainImage ? (
          <img src={mainImage} alt="Story" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-[#333333]" />
          </div>
        )}

        {/* Story progress bar */}
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white w-1/3 rounded-full" />
        </div>

        {/* Story header */}
        <div className="absolute top-5 left-3 right-3 flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${profile.avatarBg} flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white/30`}>
            {profile.avatarLetter}
          </div>
          <span className="text-white text-[11px] font-semibold drop-shadow-lg">{profile.username}</span>
          <span className="text-white/50 text-[10px]">1h</span>
        </div>

        {/* Story caption overlay */}
        {post?.title && (
          <div className="absolute bottom-12 left-3 right-3">
            <p className="text-white text-[13px] font-medium drop-shadow-lg leading-snug">
              {post.title}
            </p>
          </div>
        )}

        {/* Story reply bar */}
        <div className="absolute bottom-4 left-3 right-3">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 flex items-center border border-white/20">
            <span className="text-white/50 text-[10px]">Send message</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ post, isLoading }: { post: Post | null; isLoading: boolean }) {
  const profile = getProfileInfo(post);
  const mainImage = post?.image_url;

  return (
    <div className="w-full max-w-md bg-[#1A1A1A] rounded-xl border border-[#262626] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full ${profile.avatarBg} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {profile.avatarLetter}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#FAFAFA]">{profile.displayName}</p>
          <p className="text-[11px] text-[#737373] leading-snug">Wine Education & Events</p>
          <p className="text-[11px] text-[#525252]">1h • 🌐</p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-[#737373] flex-shrink-0" />
      </div>

      {/* Caption */}
      {post && (
        <div className="px-4 pb-3">
          <p className="text-[13px] text-[#FAFAFA] leading-relaxed">
            {post.title && <span className="font-medium">{post.title}</span>}
            {post.body_copy && (
              <>
                <br />
                {post.body_copy.length > 200 ? post.body_copy.substring(0, 200) + '... more' : post.body_copy}
              </>
            )}
          </p>
          {post.hashtags && post.hashtags.length > 0 && (
            <p className="text-[13px] text-[#003366] mt-1">
              {post.hashtags.slice(0, 3).join(' ')}
            </p>
          )}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[1.91/1] bg-[#0F0F0F]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mainImage ? (
          <img src={mainImage} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#333333]">
            <ImageIcon className="w-12 h-12 opacity-30" />
          </div>
        )}
      </div>

      {/* Reactions bar */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-[#262626]">
        <div className="flex items-center gap-1">
          <span className="text-[11px]">👍❤️🎉</span>
          <span className="text-[12px] text-[#737373]">42</span>
        </div>
        <span className="text-[12px] text-[#737373]">5 comments</span>
      </div>

      {/* Action buttons */}
      <div className="px-2 py-1 flex items-center justify-around border-t border-[#262626]">
        {['Like', 'Comment', 'Repost', 'Send'].map((action) => (
          <button key={action} className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-[#737373] font-medium hover:bg-[#262626] rounded-md transition-colors">
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PreviewSection({ post, previewMode, onModeChange, isLoading, onSelectImage }: PreviewSectionProps) {
  return (
    <div className="dashboard-card p-6 h-full flex flex-col animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-4 mb-5 flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C4A775] to-[#D4AF7A] flex items-center justify-center shadow-lg shadow-[#C4A775]/20">
          <ImageIcon className="w-6 h-6 text-[#0F0F0F]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">Anteprima Visiva</h2>
          <p className="text-xs text-[#737373]">Preview sui diversi formati</p>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex flex-col gap-2 mb-5 flex-shrink-0">
        {(Object.keys(previewConfigs) as PreviewMode[]).map((mode) => {
          const { icon: Icon, label } = previewConfigs[mode];
          const isActive = previewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                  ? 'bg-[#003366]/20 text-[#004A8F] border border-[#003366]/50'
                  : 'bg-[#1A1A1A] text-[#737373] border border-[#262626] hover:border-[#333333] hover:text-[#A3A3A3]'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto scroll-container">
        {previewMode === 'feed' && (
          <InstagramFeedPreview post={post} isLoading={isLoading} onSelectImage={onSelectImage} />
        )}
        {previewMode === 'story' && (
          <StoryPreview post={post} isLoading={isLoading} />
        )}
        {previewMode === 'linkedin' && (
          <LinkedInPreview post={post} isLoading={isLoading} />
        )}
      </div>

      {/* Image Prompt Display */}
      {post?.image_prompt && (
        <div className="mt-4 p-4 bg-[#1A1A1A] rounded-xl border border-[#262626] flex-shrink-0">
          <p className="text-xs font-semibold text-[#525252] uppercase tracking-wider mb-2">
            Prompt Immagine
          </p>
          <p className="text-sm text-[#737373] italic line-clamp-2">&ldquo;{post.image_prompt}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
