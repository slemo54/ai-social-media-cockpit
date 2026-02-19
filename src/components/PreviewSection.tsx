/* eslint-disable @next/next/no-img-element */
import { ImageIcon, Smartphone, Monitor, Square, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
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
    avatarBg: isIWA ? 'bg-gradient-to-br from-[#5C2D91] to-[#D4AF37]' : 'bg-gradient-to-br from-[#CD212A] to-[#4A0E4E]',
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
    <div className="w-full max-w-[340px] bg-white rounded-2xl border border-[#E8E0D8] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full ${profile.avatarBg} flex items-center justify-center text-white text-xs font-bold ring-2 ring-pink-400 ring-offset-1`}>
            {profile.avatarLetter}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#262626] leading-tight">{profile.username}</p>
            <p className="text-[11px] text-[#8e8e8e]">Sponsored</p>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-[#262626]" />
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-[#fafafa]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-[#C8956C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[#8e8e8e] text-xs">Generazione...</p>
            </div>
          </div>
        ) : mainImage ? (
          <img src={mainImage} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#c7c7c7]">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-1 opacity-40" />
              <p className="text-xs">Immagine apparirà qui</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-[#262626] cursor-pointer hover:text-[#ed4956] transition-colors" />
            <MessageCircle className="w-6 h-6 text-[#262626] cursor-pointer" />
            <Send className="w-6 h-6 text-[#262626] cursor-pointer" />
          </div>
          <Bookmark className="w-6 h-6 text-[#262626] cursor-pointer" />
        </div>

        {/* Likes */}
        <p className="text-[13px] font-semibold text-[#262626] mb-1">
          Liked by <span className="font-bold">wine_lover</span> and <span className="font-bold">others</span>
        </p>

        {/* Caption */}
        {post && (
          <div className="mb-1">
            <p className="text-[13px] text-[#262626] leading-snug">
              <span className="font-semibold">{profile.username}</span>{' '}
              {post.title && <span className="font-medium">{post.title} </span>}
              {post.body_copy && (
                <span className="text-[#262626]">
                  {post.body_copy.length > 120 ? post.body_copy.substring(0, 120) + '...' : post.body_copy}
                </span>
              )}
            </p>
            {post.hashtags && post.hashtags.length > 0 && (
              <p className="text-[13px] text-[#00376b] mt-0.5">
                {post.hashtags.slice(0, 5).join(' ')}
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[11px] text-[#8e8e8e] uppercase tracking-wide pb-2">Just now</p>
      </div>

      {/* Image Proposals */}
      {hasProposals && (
        <div className="border-t border-[#efefef] px-3 py-2.5">
          <p className="text-[11px] font-medium text-[#8e8e8e] uppercase tracking-wide mb-2">Scegli immagine</p>
          <div className="grid grid-cols-3 gap-1.5">
            {proposals.map((url, idx) => (
              <button
                key={idx}
                onClick={() => onSelectImage?.(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  idx === selectedIndex
                    ? 'border-[#5C2D91] shadow-md scale-[1.02]'
                    : 'border-transparent hover:border-[#E8E0D8]'
                }`}
              >
                <img src={url} alt={`Proposal ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === selectedIndex && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-[#5C2D91] rounded-full flex items-center justify-center">
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
      <div className="relative aspect-[9/16] bg-black rounded-3xl overflow-hidden border-2 border-[#E8E0D8] shadow-lg">
        {/* Story image */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#2D2D2D] to-[#1a1a1a]">
            <div className="w-8 h-8 border-2 border-[#5C2D91] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mainImage ? (
          <img src={mainImage} alt="Story" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#2D2D2D] to-[#1a1a1a] flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-white/30" />
          </div>
        )}

        {/* Story progress bar */}
        <div className="absolute top-2 left-2 right-2 h-0.5 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white w-1/3 rounded-full" />
        </div>

        {/* Story header */}
        <div className="absolute top-4 left-3 right-3 flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full ${profile.avatarBg} flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-white/50`}>
            {profile.avatarLetter}
          </div>
          <span className="text-white text-[11px] font-semibold drop-shadow-md">{profile.username}</span>
          <span className="text-white/60 text-[10px]">1h</span>
        </div>

        {/* Story caption overlay */}
        {post?.title && (
          <div className="absolute bottom-8 left-3 right-3">
            <p className="text-white text-[12px] font-medium drop-shadow-lg leading-snug">
              {post.title}
            </p>
          </div>
        )}

        {/* Story reply bar */}
        <div className="absolute bottom-2 left-3 right-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center">
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
    <div className="w-full max-w-md bg-white rounded-xl border border-[#e0e0e0] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full ${profile.avatarBg} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {profile.avatarLetter}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#000000e6]">{profile.displayName}</p>
          <p className="text-[11px] text-[#00000099] leading-snug">Wine Education & Events</p>
          <p className="text-[11px] text-[#00000099]">1h • 🌐</p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-[#00000099] flex-shrink-0" />
      </div>

      {/* Caption */}
      {post && (
        <div className="px-4 pb-3">
          <p className="text-[13px] text-[#000000e6] leading-relaxed">
            {post.title && <span className="font-medium">{post.title}</span>}
            {post.body_copy && (
              <>
                <br />
                {post.body_copy.length > 200 ? post.body_copy.substring(0, 200) + '... more' : post.body_copy}
              </>
            )}
          </p>
          {post.hashtags && post.hashtags.length > 0 && (
            <p className="text-[13px] text-[#0a66c2] mt-1">
              {post.hashtags.slice(0, 3).join(' ')}
            </p>
          )}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[1.91/1] bg-[#f3f2ef]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#0a66c2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mainImage ? (
          <img src={mainImage} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#c7c7c7]">
            <ImageIcon className="w-10 h-10 opacity-40" />
          </div>
        )}
      </div>

      {/* Reactions bar */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-[#e0e0e0]">
        <div className="flex items-center gap-1">
          <span className="text-[11px]">👍❤️🎉</span>
          <span className="text-[12px] text-[#00000099]">42</span>
        </div>
        <span className="text-[12px] text-[#00000099]">5 comments</span>
      </div>

      {/* Action buttons */}
      <div className="px-2 py-1 flex items-center justify-around">
        {['Like', 'Comment', 'Repost', 'Send'].map((action) => (
          <button key={action} className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-[#00000099] font-medium hover:bg-[#f3f2ef] rounded-md transition-colors">
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PreviewSection({ post, previewMode, onModeChange, isLoading, onSelectImage }: PreviewSectionProps) {
  return (
    <div className="glass-card p-5 h-full flex flex-col animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C2D91] to-[#722F37] flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#2D2D2D]">Anteprima Visiva</h2>
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
                  ? 'toggle-btn active text-[#5C2D91]'
                  : 'toggle-btn text-[#9B8E82] hover:text-[#6B5E52]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
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
        <div className="mt-4 p-3 bg-[#F5EFE7] rounded-xl border border-[#E8E0D8] flex-shrink-0">
          <p className="text-xs font-medium text-[#9B8E82] uppercase tracking-wide mb-1">
            Prompt Immagine
          </p>
          <p className="text-sm text-[#6B5E52] italic line-clamp-2">&ldquo;{post.image_prompt}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
