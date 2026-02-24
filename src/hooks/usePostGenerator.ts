'use client';

import { useState, useCallback, useRef } from 'react';
import { Post, PreviewMode, GenerateResponse, Project } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface UsePostGeneratorReturn {
  post: Post | null;
  isLoading: boolean;
  error: string | null;
  previewMode: PreviewMode;
  project: Project;
  generatePost: (topic: string, projectOverride?: Project, imageUrl?: string) => Promise<void>;
  updatePost: (updates: Partial<Post>) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  setProject: (project: Project) => void;
  markAsPublished: () => Promise<void>;
  copyToClipboard: () => void;
  downloadImage: () => void;
  cancelGeneration: () => void;
  isCancelling: boolean;
  selectImage: (index: number) => void;
  selectTextProposal: (index: number) => void;
}

export function usePostGenerator(): UsePostGeneratorReturn {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('feed');
  const [project, setProject] = useState<Project>('IWP');

  // Ref per tracciare se il componente è montato
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    apiClient.cancelAll();
    setIsCancelling(true);
    setIsLoading(false);
    toast.info('Generazione annullata');
    setTimeout(() => setIsCancelling(false), 500);
  }, []);

  const generatePost = useCallback(async (topic: string, projectOverride?: Project, imageUrl?: string) => {
    const activeProject = projectOverride || project;
    setIsLoading(true);
    setError(null);
    setIsCancelling(false);

    // Crea un nuovo AbortController per questa richiesta
    abortControllerRef.current = new AbortController();

    try {
      const result = await apiClient.requestWithRetry(async () => {
        const response = await apiClient.fetchWithTimeout('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            project: activeProject,
            imageUrl, // Invia l'URL dell'immagine se presente
          }),
          timeout: 120000, // 2 minuti per generazione con immagine
          signal: abortControllerRef.current?.signal,
        });
        return apiClient.checkResponse(response);
      }, {
        retries: 2,
        timeout: 120000,
        retryDelay: 1500,
        backoffMultiplier: 2,
      });

      const data: GenerateResponse = await result.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to generate post');
      }

      setPost(data.data);
      setError(null);
    } catch (err) {
      // Ignora errori di abort
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      // Mostra toast solo per errori non di abort
      if (!errorMessage.includes('aborted')) {
        toast.error(`Errore: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [project]);

  const updatePost = useCallback((updates: Partial<Post>) => {
    setPost((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const markAsPublished = useCallback(async () => {
    if (!post) return;

    try {
      const result = await apiClient.requestWithRetry(async () => {
        const response = await apiClient.fetchWithTimeout(`/api/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
          timeout: 10000,
        });
        return apiClient.checkResponse(response);
      });

      const data = await result.json();

      if (data.success) {
        setPost((prev) => (prev ? { ...prev, status: 'published' } : null));
        toast.success('Post pubblicato! 🎉');
      }
    } catch (err) {
      console.error('Error marking as published:', err);
      toast.error('Errore nella pubblicazione');
    }
  }, [post]);

  const copyToClipboard = useCallback(() => {
    if (!post) return;

    const content = `${post.title}\n\n${post.body_copy}\n\n${post.hashtags?.join(' ')}`;
    navigator.clipboard.writeText(content);
    toast.success('Contenuto copiato! Cin Cin! 🍷');
  }, [post]);

  const downloadImage = useCallback(() => {
    if (!post?.image_url) {
      toast.error('Nessuna immagine da scaricare');
      return;
    }

    const link = document.createElement('a');
    link.href = post.image_url;
    link.download = `post-${post.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Immagine scaricata!');
  }, [post]);

  const selectImage = useCallback((index: number) => {
    if (!post?.image_proposals || index < 0 || index >= post.image_proposals.length) return;
    setPost((prev) =>
      prev
        ? {
          ...prev,
          image_url: prev.image_proposals![index],
          selected_image_index: index,
        }
        : null
    );
    toast.success(`Immagine ${index + 1} selezionata`);
  }, [post]);

  const selectTextProposal = useCallback((index: number) => {
    if (!post?.text_proposals || index < 0 || index >= post.text_proposals.length) return;
    const proposal = post.text_proposals[index];
    setPost((prev) =>
      prev
        ? {
          ...prev,
          title: proposal.title,
          body_copy: proposal.body_copy,
          hashtags: proposal.hashtags,
          image_prompt: proposal.image_prompt,
          selected_text_index: index,
        }
        : null
    );
    toast.success(`Variante testo ${index + 1} selezionata`);
  }, [post]);

  return {
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
    selectTextProposal,
  };
}
