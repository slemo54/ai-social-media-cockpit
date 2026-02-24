'use client';

import { InputSection } from '@/components/InputSection';
import { PreviewSection } from '@/components/PreviewSection';
import { EditorSection } from '@/components/EditorSection';
import { ImageEditor } from '@/components/ImageEditor';
import { usePostGenerator } from '@/hooks/usePostGenerator';
import { Toaster } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { Wine, Home, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function GeneratePage() {
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
        <main className="h-screen flex flex-col overflow-hidden bg-[#0F0F0F]">
            <Toaster
                position="top-center"
                richColors
                toastOptions={{
                    style: {
                        background: '#1A1A1A',
                        border: '1px solid #262626',
                        color: '#FAFAFA',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    },
                }}
            />

            {/* Header */}
            <header className="flex-shrink-0 border-b border-[#262626] bg-[#141414]">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#003366] via-[#004A8F] to-[#C4A775] flex items-center justify-center shadow-lg shadow-[#003366]/20">
                                <Wine className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[#FAFAFA]">
                                    AI Social Cockpit
                                </h1>
                                <p className="text-xs text-[#737373]">
                                    Genera Contenuto
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowImageEditor(!showImageEditor)}
                                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showImageEditor
                                    ? 'bg-[#003366]/20 text-[#004A8F] border border-[#003366]/50'
                                    : 'bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] text-[#A3A3A3] hover:text-[#FAFAFA]'
                                    }`}
                            >
                                <ImageIcon className="w-4 h-4" />
                                {showImageEditor ? 'Chiudi Editor' : 'Editor Immagine'}
                            </button>

                            <Link
                                href="/"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] rounded-xl text-[#A3A3A3] hover:text-[#FAFAFA] text-sm font-medium transition-all"
                            >
                                <Home className="w-4 h-4" />
                                Dashboard
                            </Link>

                            <span className="px-3 py-1.5 bg-[#003366]/20 text-[#004A8F] text-xs font-semibold rounded-full border border-[#003366]/30">
                                Human-in-the-Loop
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
                        <p className="text-red-400 text-sm">{error}</p>
                        {isLoading && (
                            <button
                                onClick={cancelGeneration}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
                            >
                                Annulla
                            </button>
                        )}
                    </div>
                )}

                {/* Loading Progress */}
                {isLoading && !error && (
                    <div className="mb-4 p-4 bg-[#003366]/10 border border-[#003366]/30 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[#004A8F] text-sm font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#003366] rounded-full animate-pulse" />
                                Generazione in corso...
                            </p>
                            <button
                                onClick={cancelGeneration}
                                disabled={isCancelling}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-[#A3A3A3] text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X className="w-3 h-3" />
                                Annulla
                            </button>
                        </div>
                        <div className="w-full bg-[#262626] rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#003366] via-[#004A8F] to-[#C4A775] h-full rounded-full animate-pulse w-2/3" />
                        </div>
                    </div>
                )}

                <div className={`grid gap-5 h-full ${showImageEditor ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
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
            <footer className="flex-shrink-0 border-t border-[#262626] bg-[#141414]">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-[#525252]">
                            by Anselmo Acquah — powered by Abacus API
                        </p>
                        <div className="flex items-center gap-4">
                            <span className="text-[#525252] text-xs">IWP o IWA</span>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#C8102E]"></span>
                                <span className="w-2 h-2 rounded-full bg-[#003366]"></span>
                                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
