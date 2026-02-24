'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload, Type, Eraser, UserX, Sparkles, X, Check, RotateCcw,
  Download, Loader2, ImageIcon, Wand2
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

const PLACEHOLDERS: Record<EditOperation, string> = {
  add_text: 'Esempio: "Usa font elegante, colore oro, ombra leggera"',
  remove_text: 'Esempio: "Rimuovi solo il testo in basso, lascia il logo"',
  remove_person: 'Esempio: "Rimuovi tutti tranne la persona al centro"',
  enhance: 'Esempio: "Aumenta contrasto, luci più calde, look professionale"',
};

export function ImageEditor({ initialImageUrl, onImageChange, onClose }: ImageEditorProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    operation: null,
    progress: 0,
  });

  const [textToAdd, setTextToAdd] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Advanced mode state
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [lastOperation, setLastOperation] = useState<EditOperation | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = useCallback((url: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(url);
      if (newHistory.length > 10) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 9));
  }, [historyIndex]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setEditState({ isEditing: true, operation: null, progress: 10 });
      const compressedBlob = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85
      });
      setEditState(prev => ({ ...prev, progress: 30 }));
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      const base64 = await fileToBase64(compressedFile);
      setEditState(prev => ({ ...prev, progress: 50 }));

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

  const performEdit = useCallback(async (
    operation: EditOperation,
    baseParams: Record<string, any> = {}
  ) => {
    if (!imageBase64 && !imageUrl) {
      toast.error('Carica prima un\'immagine');
      return;
    }

    try {
      setEditState({ isEditing: true, operation, progress: 10 });
      setLastOperation(operation);
      
      let base64ToEdit = imageBase64;
      if (!base64ToEdit && imageUrl) {
        setEditState(prev => ({ ...prev, progress: 20 }));
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });
        base64ToEdit = await fileToBase64(file);
      }

      setEditState(prev => ({ ...prev, progress: 40 }));

      // Build params with custom prompt if in advanced mode
      const params = {
        ...baseParams,
        ...(isAdvancedMode && customPrompt.trim() ? { customPrompt: customPrompt.trim() } : {}),
      };

      const result = await apiClient.requestWithRetry(async () => {
        const response = await apiClient.fetchWithTimeout('/api/image/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64ToEdit,
            operation,
            params,
          }),
          timeout: 120000,
        });
        return apiClient.checkResponse(response);
      }, { retries: 2, timeout: 120000 });

      setEditState(prev => ({ ...prev, progress: 80 }));
      const data = await result.json();

      if (data.success) {
        const editedUrl = data.imageBase64
          ? `data:image/jpeg;base64,${data.imageBase64}`
          : data.imageUrl;
        setImageUrl(editedUrl);
        if (data.imageBase64) {
          setImageBase64(data.imageBase64);
        }
        saveToHistory(editedUrl);
        onImageChange?.(editedUrl);
        
        // Reset custom prompt after successful edit
        if (isAdvancedMode) {
          setCustomPrompt('');
        }
        
        toast.success('Immagine modificata con successo!');
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Errore nella modifica dell\'immagine');
    } finally {
      setEditState({ isEditing: false, operation: null, progress: 0 });
    }
  }, [imageBase64, imageUrl, onImageChange, saveToHistory, isAdvancedMode, customPrompt]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousUrl = history[newIndex];
      setImageUrl(previousUrl);
      onImageChange?.(previousUrl);
    }
  }, [history, historyIndex, onImageChange]);

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

  const getCurrentPlaceholder = () => {
    if (lastOperation) {
      return PLACEHOLDERS[lastOperation];
    }
    return 'Descrivi come vuoi modificare l\'immagine...';
  };

  const ProgressBar = () => (
    <div className="w-full bg-[#262626] rounded-full h-2 overflow-hidden">
      <div
        className="bg-gradient-to-r from-[#003366] via-[#004A8F] to-[#C4A775] h-full transition-all duration-300"
        style={{ width: `${editState.progress}%` }}
      />
    </div>
  );

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 h-full overflow-y-auto rounded-2xl relative overflow-hidden">
      {/* Ambient glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#003366]/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#004A8F] flex items-center justify-center shadow-lg shadow-[#003366]/20">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#FAFAFA]">Editor Immagine</h3>
            <p className="text-xs text-[#737373]">Modifica con AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0 || editState.isEditing}
            className="p-2 text-[#737373] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] rounded-lg transition-all disabled:opacity-30"
            title="Annulla"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={!imageUrl || editState.isEditing}
            className="p-2 text-[#737373] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] rounded-lg transition-all disabled:opacity-30"
            title="Scarica"
          >
            <Download className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-[#737373] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="relative aspect-square bg-[#0F0F0F] rounded-xl overflow-hidden flex items-center justify-center border border-[#262626]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Edited"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#262626]">
              <ImageIcon className="w-10 h-10 text-[#003366] opacity-50" />
            </div>
            <p className="text-[#737373]">Nessuna immagine caricata</p>
            <p className="text-xs text-[#525252] mt-1">Carica un'immagine per iniziare</p>
          </div>
        )}

        {editState.isEditing && (
          <div className="absolute inset-0 bg-[#0F0F0F]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-[#004A8F] animate-spin" />
            <p className="text-[#A3A3A3] text-sm">
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
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#003366] to-[#004A8F] hover:shadow-lg hover:shadow-[#003366]/30 text-white rounded-xl transition-all disabled:opacity-50 font-medium"
          >
            <Upload className="w-5 h-5" />
            Carica Immagine
          </button>
          <p className="text-xs text-[#525252] text-center">
            JPG, PNG, WebP • Max 10MB
          </p>
        </div>
      )}

      {/* Editing Tools */}
      {imageUrl && !editState.isEditing && (
        <div className="space-y-4">
          {/* Add Text */}
          <div className="border-t border-[#262626] pt-4">
            <h4 className="text-sm font-medium text-[#A3A3A3] mb-3 flex items-center gap-2">
              <Type className="w-4 h-4 text-[#004A8F]" />
              Aggiungi Testo
            </h4>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={textToAdd}
                onChange={(e) => setTextToAdd(e.target.value)}
                placeholder="Testo da aggiungere..."
                className="dashboard-input w-full text-sm"
              />
              <div className="flex gap-2">
                {(['top', 'center', 'bottom'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setTextPosition(pos)}
                    className={`flex-1 py-2 text-xs rounded-lg transition-all font-medium ${
                      textPosition === pos
                        ? 'bg-[#003366] text-white shadow-lg shadow-[#003366]/20'
                        : 'bg-[#1A1A1A] text-[#737373] hover:text-[#A3A3A3] border border-[#262626]'
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
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#262626] text-[#FAFAFA] text-sm rounded-xl transition-all disabled:opacity-50 border border-[#262626] font-medium"
              >
                <Check className="w-4 h-4" />
                Applica Testo
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-[#262626] pt-4">
            <h4 className="text-sm font-medium text-[#A3A3A3] mb-3">
              Strumenti AI
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => performEdit('remove_text')}
                className="flex flex-col items-center gap-2 p-3 bg-[#1A1A1A] hover:bg-[#262626] text-[#A3A3A3] hover:text-[#FAFAFA] rounded-xl transition-all border border-[#262626]"
              >
                <Eraser className="w-5 h-5" />
                <span className="text-xs font-medium">Rimuovi Testo</span>
              </button>
              <button
                onClick={() => performEdit('remove_person')}
                className="flex flex-col items-center gap-2 p-3 bg-[#1A1A1A] hover:bg-[#262626] text-[#A3A3A3] hover:text-[#FAFAFA] rounded-xl transition-all border border-[#262626]"
              >
                <UserX className="w-5 h-5" />
                <span className="text-xs font-medium">Rimuovi Persone</span>
              </button>
              <button
                onClick={() => performEdit('enhance')}
                className="flex flex-col items-center gap-2 p-3 bg-gradient-to-r from-[#003366]/20 to-[#004A8F]/20 hover:from-[#003366]/30 hover:to-[#004A8F]/30 text-[#004A8F] rounded-xl transition-all border border-[#003366]/30 col-span-2"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-medium">Migliora Qualità</span>
              </button>
            </div>
          </div>

          {/* Advanced Mode Toggle */}
          <div className="border-t border-[#262626] pt-4">
            <button
              onClick={() => {
                setIsAdvancedMode(!isAdvancedMode);
                if (isAdvancedMode) {
                  setCustomPrompt('');
                }
              }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all border font-medium text-sm ${
                isAdvancedMode
                  ? 'bg-[#003366]/20 text-[#004A8F] border-[#003366]/50'
                  : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#262626] hover:border-[#333333]'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              {isAdvancedMode ? 'Disattiva Modalità Avanzata' : 'Attiva Modalità Avanzata'}
            </button>

            {/* Custom Prompt Textarea */}
            {isAdvancedMode && (
              <div className="mt-3 animate-fade-in-up">
                <label className="text-xs text-[#737373] mb-2 block">
                  Prompt personalizzato (opzionale)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => {
                    if (e.target.value.length <= 400) {
                      setCustomPrompt(e.target.value);
                    }
                  }}
                  placeholder={getCurrentPlaceholder()}
                  className="dashboard-input w-full h-24 resize-none text-sm"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-[#525252]">
                    {customPrompt.length}/400 caratteri
                  </p>
                  <p className="text-xs text-[#525252]">
                    Clicca uno strumento AI per applicare
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Change Image */}
          <div className="border-t border-[#262626] pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-[#1A1A1A] text-[#737373] hover:text-[#A3A3A3] text-sm rounded-xl transition-all border border-[#262626]"
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
