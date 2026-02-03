'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  Upload, Type, Eraser, UserX, Sparkles, X, Check, RotateCcw,
  Download, Save, Loader2, ImageIcon
} from 'lucide-react';
import { apiClient, fileToBase64, compressImage } from '@/lib/api-client';
import { toast } from 'sonner';

interface ImageEditorProps {
  initialImageUrl?: string;
  onImageChange?: (url: string) => void;
  onClose?: () => void;
}

type EditOperation = 'add_text' | 'remove_text' | 'remove_person' | 'enhance';

interface EditState {
  isEditing: boolean;
  operation: EditOperation | null;
  progress: number;
}

export function ImageEditor({ initialImageUrl, onImageChange, onClose }: ImageEditorProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    operation: null,
    progress: 0,
  });
  
  // Parametri per le varie operazioni
  const [textToAdd, setTextToAdd] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Salva stato nell'history
  const saveToHistory = useCallback((url: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(url);
      // Mantieni solo gli ultimi 10 stati
      if (newHistory.length > 10) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 9));
  }, [historyIndex]);

  // Upload immagine
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setEditState({ isEditing: true, operation: null, progress: 10 });
      
      // Comprimi l'immagine prima dell'upload
      const compressedBlob = await compressImage(file, { 
        maxWidth: 1200, 
        maxHeight: 1200,
        quality: 0.85 
      });
      
      setEditState(prev => ({ ...prev, progress: 30 }));
      
      // Converti in base64 per preview
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      const base64 = await fileToBase64(compressedFile);
      
      setEditState(prev => ({ ...prev, progress: 50 }));
      
      // Upload al server
      const formData = new FormData();
      formData.append('image', compressedFile);
      
      const result = await apiClient.requestWithRetry(async () => {
        const response = await apiClient.fetchWithTimeout('/api/image/upload', {
          method: 'POST',
          body: formData,
          timeout: 60000,
        });
        return apiClient.checkResponse(response);
      });

      const data = await result.json();
      
      if (data.success) {
        setImageUrl(data.url);
        setImageBase64(base64);
        saveToHistory(data.url);
        onImageChange?.(data.url);
        toast.success('Immagine caricata con successo!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Errore nel caricamento dell\'immagine');
    } finally {
      setEditState({ isEditing: false, operation: null, progress: 0 });
    }
  }, [onImageChange, saveToHistory]);

  // Esegui operazione di editing
  const performEdit = useCallback(async (
    operation: EditOperation,
    params: Record<string, any> = {}
  ) => {
    if (!imageBase64 && !imageUrl) {
      toast.error('Carica prima un\'immagine');
      return;
    }

    try {
      setEditState({ isEditing: true, operation, progress: 10 });

      // Se abbiamo solo l'URL, dobbiamo caricare l'immagine
      let base64ToEdit = imageBase64;
      if (!base64ToEdit && imageUrl) {
        setEditState(prev => ({ ...prev, progress: 20 }));
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });
        base64ToEdit = await fileToBase64(file);
      }

      setEditState(prev => ({ ...prev, progress: 40 }));

      const result = await apiClient.requestWithRetry(async () => {
        const response = await apiClient.fetchWithTimeout('/api/image/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64ToEdit,
            operation,
            params,
          }),
          timeout: 120000, // 2 minuti per editing
        });
        return apiClient.checkResponse(response);
      }, { retries: 2, timeout: 120000 });

      setEditState(prev => ({ ...prev, progress: 80 }));

      const data = await result.json();

      if (data.success) {
        // Converti base64 in URL per visualizzazione
        const editedUrl = data.imageBase64 
          ? `data:image/jpeg;base64,${data.imageBase64}`
          : data.imageUrl;
        
        setImageUrl(editedUrl);
        if (data.imageBase64) {
          setImageBase64(data.imageBase64);
        }
        saveToHistory(editedUrl);
        onImageChange?.(editedUrl);
        toast.success('Immagine modificata con successo!');
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Errore nella modifica dell\'immagine');
    } finally {
      setEditState({ isEditing: false, operation: null, progress: 0 });
    }
  }, [imageBase64, imageUrl, onImageChange, saveToHistory]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousUrl = history[newIndex];
      setImageUrl(previousUrl);
      onImageChange?.(previousUrl);
    }
  }, [history, historyIndex, onImageChange]);

  // Download immagine
  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `edited-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Immagine scaricata!');
  }, [imageUrl]);

  // Progress bar component
  const ProgressBar = () => (
    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
      <div 
        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
        style={{ width: `${editState.progress}%` }}
      />
    </div>
  );

  return (
    <div className="glass-card p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-400" />
          Editor Immagine
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0 || editState.isEditing}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            title="Annulla"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={!imageUrl || editState.isEditing}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            title="Scarica"
          >
            <Download className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="relative aspect-square bg-black/30 rounded-xl overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Edited"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-8">
            <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Nessuna immagine caricata</p>
          </div>
        )}
        
        {editState.isEditing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-white text-sm">
              {editState.operation === 'add_text' && 'Aggiungendo testo...'}
              {editState.operation === 'remove_text' && 'Rimuovendo testo...'}
              {editState.operation === 'remove_person' && 'Rimuovendo persone...'}
              {editState.operation === 'enhance' && 'Migliorando qualità...'}
              {!editState.operation && 'Elaborando...'}
            </p>
            <div className="w-48">
              <ProgressBar />
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {!imageUrl && (
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={editState.isEditing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            Carica Immagine
          </button>
          <p className="text-xs text-white/40 text-center">
            JPG, PNG, WebP • Max 10MB
          </p>
        </div>
      )}

      {/* Editing Tools */}
      {imageUrl && !editState.isEditing && (
        <div className="space-y-4">
          {/* Add Text */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Aggiungi Testo
            </h4>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={textToAdd}
                onChange={(e) => setTextToAdd(e.target.value)}
                placeholder="Testo da aggiungere..."
                className="glass-input px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                {(['top', 'center', 'bottom'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setTextPosition(pos)}
                    className={`flex-1 py-1 text-xs rounded-lg transition-colors ${
                      textPosition === pos
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {pos === 'top' && 'Alto'}
                    {pos === 'center' && 'Centro'}
                    {pos === 'bottom' && 'Basso'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => performEdit('add_text', { 
                  text: textToAdd, 
                  position: textPosition 
                })}
                disabled={!textToAdd.trim()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Applica Testo
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-medium text-white/70 mb-2">
              Strumenti AI
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => performEdit('remove_text')}
                className="flex flex-col items-center gap-1 p-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors"
              >
                <Eraser className="w-5 h-5" />
                <span className="text-xs">Rimuovi Testo</span>
              </button>
              <button
                onClick={() => performEdit('remove_person')}
                className="flex flex-col items-center gap-1 p-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors"
              >
                <UserX className="w-5 h-5" />
                <span className="text-xs">Rimuovi Persone</span>
              </button>
              <button
                onClick={() => performEdit('enhance')}
                className="flex flex-col items-center gap-1 p-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors col-span-2"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs">Migliora Qualità</span>
              </button>
            </div>
          </div>

          {/* Change Image */}
          <div className="border-t border-white/10 pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Cambia Immagine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
