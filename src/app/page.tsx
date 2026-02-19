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
    selectImage,
  } = usePostGenerator();

  const [mounted, setMounted] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerate = useCallback(async (topic: string, selectedProject: 'IWP' | 'IWA', imageUrl?: string) => {
    await generatePost(topic, selectedProject, imageUrl);
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
    if (post) {
      updatePost({ image_url: newUrl });
    }
  }, [post, updatePost]);

  if (!mounted) return null;

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-[#FAF9F6]">
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #E8E0D8',
            color: '#2D2D2D',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          },
        }}
      />

      {/* Header */}
      <header className="flex-shrink-0 border-b border-[#E8E0D8] bg-white/80 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C2D91] to-[#722F37] flex items-center justify-center shadow-md">
                <Wine className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#2D2D2D]">
                  AI Social
                </h1>
                <p className="text-xs text-[#9B8E82]">
                  IWP × IWA Content Generator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImageEditor(!showImageEditor)}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                  showImageEditor
                    ? 'bg-[#5C2D91]/10 border-[#5C2D91]/50 text-[#5C2D91]'
                    : 'bg-white hover:bg-[#F5EFE7] border-[#E8E0D8] text-[#6B5E52]'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                {showImageEditor ? 'Chiudi Editor' : 'Editor Immagine'}
              </button>
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-[#F5EFE7] border border-[#E8E0D8] rounded-lg text-[#6B5E52] text-sm transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <span className="px-2.5 py-1 bg-[#5C2D91]/10 text-[#5C2D91] text-xs font-medium rounded-full border border-[#5C2D91]/20">
                Human-in-the-Loop
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-red-600 text-sm">{error}</p>
            {isLoading && (
              <button
                onClick={cancelGeneration}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs rounded-lg transition-colors"
              >
                Annulla
              </button>
            )}
          </div>
        )}

        {/* Loading Progress */}
        {isLoading && !error && (
          <div className="mb-4 p-4 bg-[#5C2D91]/5 border border-[#5C2D91]/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#5C2D91] text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-[#5C2D91] rounded-full animate-pulse" />
                Generazione in corso...
              </p>
              <button
                onClick={cancelGeneration}
                disabled={isCancelling}
                className="flex items-center gap-1 px-3 py-1 bg-[#F5EFE7] hover:bg-[#E8E0D8] text-[#6B5E52] text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                Annulla
              </button>
            </div>
            <div className="w-full bg-[#E8E0D8] rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-[#5C2D91] via-[#722F37] to-[#D4AF37] h-full rounded-full animate-pulse w-2/3" />
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
              onSelectImage={selectImage}
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

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-[#E8E0D8] bg-white/80 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#9B8E82]">
              by Anselmo Acquah — powered by Abacus API
            </p>
            <span className="text-[#9B8E82] text-xs">
              IWP o IWA
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
