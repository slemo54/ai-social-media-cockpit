'use client';

import { PreviewSection } from '@/components/PreviewSection';
import { EditorSection } from '@/components/EditorSection';
import { usePostGenerator } from '@/hooks/usePostGenerator';
import { Toaster } from 'sonner';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GenerateContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const template = searchParams.get('template');
    const topicParam = searchParams.get('topic');
    const projectParam = searchParams.get('project') as 'IWP' | 'IWA' | null;

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
        selectImage,
        selectTextProposal,
    } = usePostGenerator();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (topicParam && projectParam) {
            setProject(projectParam);
            generatePost(topicParam, projectParam);
        } else if (template) {
            // Handle template if needed, though usePostGenerator might already handle it via initialTemplate prop if passed to InputSection
            // For now, let's assume the user might have come from the dashboard quick gen
        }
    }, []);

    const handleCopy = useCallback(() => {
        copyToClipboard();
    }, [copyToClipboard]);

    const handleMarkPublished = useCallback(async () => {
        await markAsPublished();
    }, [markAsPublished]);

    if (!mounted) return null;

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-x-hidden antialiased selection:bg-accent-gold/30 pb-32">
            <Toaster position="top-center" />

            {/* Top App Bar */}
            <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 pb-3 justify-between">
                <button
                    onClick={() => router.back()}
                    className="text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
                </button>
                <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">Editor Contenuti</h2>
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center justify-center h-10 px-2 rounded-lg text-slate-500 dark:text-[#9aabbc] text-sm font-semibold hover:text-primary dark:hover:text-white transition-colors"
                >
                    Annulla
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-4 gap-6 max-w-2xl mx-auto w-full">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Preview Section */}
                <PreviewSection
                    post={post}
                    previewMode={previewMode}
                    onModeChange={setPreviewMode}
                    isLoading={isLoading}
                    onSelectImage={selectImage}
                />

                {/* Editor Section */}
                <EditorSection
                    post={post}
                    onUpdate={updatePost}
                    onCopy={handleCopy}
                    onDownload={downloadImage}
                    onMarkPublished={handleMarkPublished}
                    onSelectTextProposal={selectTextProposal}
                />
            </main>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 p-4 pb-6">
                <div className="max-w-2xl mx-auto w-full flex gap-3">
                    <button
                        onClick={() => {/* Save draft logic if separate from auto-save */}}
                        className="flex-1 h-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-200 font-semibold text-base hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
                        Salva Bozza
                    </button>
                    <button
                        onClick={handleMarkPublished}
                        disabled={!post || post.status === 'published'}
                        className="flex-1 h-12 rounded-xl bg-accent-gold text-[#101418] font-bold text-base hover:bg-[#d4b988] active:scale-[0.98] transition-all shadow-lg shadow-accent-gold/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                        Pubblica
                    </button>
                </div>
            </div>

            {/* Toast Notification Simulation */}
            {isLoading && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-auto min-w-[300px] bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-slide-up z-50">
                    <div className="flex items-center justify-center rounded-full bg-primary text-white p-0.5">
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>refresh</span>
                    </div>
                    <span className="text-sm font-medium">Generazione in corso...</span>
                </div>
            )}
        </div>
    );
}

export default function GeneratePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GenerateContent />
        </Suspense>
    );
}
