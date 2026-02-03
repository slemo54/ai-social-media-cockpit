'use client';

import { InputSection } from '@/components/InputSection';
import { PreviewSection } from '@/components/PreviewSection';
import { EditorSection } from '@/components/EditorSection';
import { ImageEditor } from '@/components/ImageEditor';
import { usePostGenerator } from '@/hooks/usePostGenerator';
import { Toaster, toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { Wine, LayoutDashboard, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();
  const template = searchParams.get('template');
  
  const {
    post,
    isLoading,
    error,
    previewMode,
    project,
    generatePost,
    updatePost,
    setPreviewMode,
    setProject,
    markAsPublished,
    copyToClipboard,
    downloadImage,
    cancelGeneration,
    isCancelling,
  } = usePostGenerator();

  const [mounted, setMounted] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerate = useCallback(async (topic: string, selectedProject: 'IWP' | 'IWA', imageUrl?: string) => {
    await generatePost(topic, selectedProject, imageUrl);
    // Non mostrare toast qui perché potrebbe essere sovrascritto da errori
  }, [generatePost]);

  const handleImageUpload = useCallback((imageUrl: string) => {
    setUploadedImage(imageUrl);
  }, []);

  const handleCopy = useCallback(() => {
    copyToClipboard();
  }, [copyToClipboard]);

  const handleMarkPublished = useCallback(async () => {
    await markAsPublished();
  }, [markAsPublished]);

  const handleImageChange = useCallback((newUrl: string) => {
    setUploadedImage(newUrl);
    // Aggiorna anche il post se esiste
    if (post) {
      updatePost({ image_url: newUrl });
    }
  }, [post, updatePost]);

  if (!mounted) return null;

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <Toaster 
        position="top-center" 
        richColors 
        toastOptions={{
          style: {
            background: 'rgba(30, 30, 60, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
          },
        }}
      />
      
      {/* Header - Fixed Height */}
      <header className="flex-shrink-0 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Wine className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  AI Social
                </h1>
                <p className="text-xs text-white/50">
                  IWP × IWA Content Generator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImageEditor(!showImageEditor)}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                  showImageEditor
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                {showImageEditor ? 'Chiudi Editor' : 'Editor Immagine'}
              </button>
              <Link 
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-sm transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30">
                Human-in-the-Loop
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Fill Remaining Space */}
      <div className="flex-1 overflow-hidden max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
            <p className="text-red-300 text-sm">{error}</p>
            {isLoading && (
              <button
                onClick={cancelGeneration}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded-lg transition-colors"
              >
                Annulla
              </button>
            )}
          </div>
        )}

        {/* Loading Progress */}
        {isLoading && !error && (
          <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-300 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                Generazione in corso...
              </p>
              <button
                onClick={cancelGeneration}
                disabled={isCancelling}
                className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white/70 text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                Annulla
              </button>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}

        <div className={`grid gap-4 h-full ${showImageEditor ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Column 1: Input */}
          <div className="h-full min-h-0">
            <InputSection 
              onGenerate={handleGenerate} 
              isLoading={isLoading}
              project={project}
              onProjectChange={setProject}
              initialTemplate={template || undefined}
              onImageUpload={handleImageUpload}
            />
          </div>

          {/* Column 2: Preview */}
          <div className="h-full min-h-0">
            <PreviewSection
              post={post}
              previewMode={previewMode}
              onModeChange={setPreviewMode}
              isLoading={isLoading}
            />
          </div>

          {/* Column 3: Editor or Image Editor */}
          <div className="h-full min-h-0">
            {showImageEditor ? (
              <ImageEditor
                initialImageUrl={uploadedImage || post?.image_url || undefined}
                onImageChange={handleImageChange}
                onClose={() => setShowImageEditor(false)}
              />
            ) : (
              <EditorSection
                post={post}
                onUpdate={updatePost}
                onCopy={handleCopy}
                onDownload={downloadImage}
                onMarkPublished={handleMarkPublished}
              />
            )}
          </div>

          {/* Column 4: Editor (when Image Editor is shown) */}
          {showImageEditor && (
            <div className="h-full min-h-0">
              <EditorSection
                post={post}
                onUpdate={updatePost}
                onCopy={handleCopy}
                onDownload={downloadImage}
                onMarkPublished={handleMarkPublished}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer - Compact */}
      <footer className="flex-shrink-0 border-t border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">
              by Anselmo Acquah — powered by Abacus API
            </p>
            <span className="text-white/40 text-xs">
              IWP o IWA
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
