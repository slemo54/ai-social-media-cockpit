'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Upload, Image as ImageIcon, Type, Palette, 
  Wand2, Download, RotateCcw, Check,
  Loader2
} from 'lucide-react';

import type { Template } from '@/types/template';

interface TemplateEditorProps {
  template: Template;
}

interface EditorState {
  uploadedImage: string | null;
  isProcessing: boolean;
  processingStep: string;
  textOverrides: Record<string, string>;
  aiOptions: {
    removeBackground: boolean;
    styleTransfer: boolean;
    enhanceFace: boolean;
  };
}

export default function TemplateEditor({ template }: TemplateEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<EditorState>({
    uploadedImage: null,
    isProcessing: false,
    processingStep: '',
    textOverrides: {},
    aiOptions: {
      removeBackground: true,
      styleTransfer: true,
      enhanceFace: false
    }
  });

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview immediata
    const reader = new FileReader();
    reader.onload = (e) => {
      setState(prev => ({
        ...prev,
        uploadedImage: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);

    // Se AI options attive, processa
    if (state.aiOptions.removeBackground || state.aiOptions.styleTransfer) {
      await processImageWithAI(file);
    }
  }, [state.aiOptions]);

  const processImageWithAI = async (file: File) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      processingStep: 'Analisi immagine...'
    }));

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const operations: string[] = [];
      if (state.aiOptions.removeBackground) operations.push('bg-remove');
      if (state.aiOptions.styleTransfer) operations.push('style-transfer');
      
      formData.append('operations', JSON.stringify(operations));
      formData.append('templateContext', template.name);

      setState(prev => ({ ...prev, processingStep: 'Elaborazione AI...' }));

      const response = await fetch('/api/image/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Processing failed');

      const data = await response.json();
      
      if (data.image) {
        setState(prev => ({
          ...prev,
          uploadedImage: data.image,
          isProcessing: false,
          processingStep: ''
        }));
      }
    } catch (error) {
      console.error('AI processing error:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingStep: ''
      }));
    }
  };

  const aspectRatio = template.dimensions.height / template.dimensions.width;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Canvas Preview */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-gray-100 rounded-xl p-8 flex items-center justify-center min-h-[500px]">
          <div 
            className="relative bg-white shadow-2xl overflow-hidden"
            style={{
              width: '100%',
              maxWidth: '500px',
              aspectRatio: `${template.dimensions.width}/${template.dimensions.height}`
            }}
          >
            {/* Template Background */}
            {template.base_assets?.background ? (
              <img 
                src={template.base_assets.background}
                alt="Template background"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50" />
            )}
            
            {/* Demo Figure Placeholder / User Image */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              {state.uploadedImage ? (
                <img
                  src={state.uploadedImage}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : template.base_assets?.demoFigure ? (
                <div className="text-center">
                  <img
                    src={template.base_assets.demoFigure}
                    alt="Demo figure"
                    className="w-48 h-48 object-contain opacity-30 mx-auto"
                  />
                  <p className="text-gray-400 text-sm mt-4">Carica una foto per sostituire</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                  <p>Nessun elemento immagine</p>
                </div>
              )}
            </div>

            {/* Processing Overlay */}
            {state.isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  <span className="text-gray-700">{state.processingStep}</span>
                </div>
              </div>
            )}

            {/* Text Layers Preview */}
            {template.layers?.filter(l => l.type === 'text').map(layer => {
              const textConfig = layer.config as import('@/types/template').TextLayerConfig | undefined;
              return (
                <div
                  key={layer.id}
                  className="absolute px-4 py-2 text-center pointer-events-none"
                  style={{
                    top: textConfig?.position?.y ? `${(textConfig.position.y / template.dimensions.height) * 100}%` : '10%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: textConfig?.fontFamily || 'sans-serif',
                    fontSize: textConfig?.fontSize ? `${(textConfig.fontSize / template.dimensions.width) * 100 * 5}px` : '24px',
                    color: textConfig?.color || '#000',
                  }}
                >
                  {state.textOverrides[layer.id] || textConfig?.defaultText || layer.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Carica Foto
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            disabled={!state.uploadedImage}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          
          <button
            disabled={!state.uploadedImage}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Esporta
          </button>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="space-y-6">
        {/* AI Options */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-600" />
            Opzioni AI
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={state.aiOptions.removeBackground}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  aiOptions: { ...prev.aiOptions, removeBackground: e.target.checked }
                }))}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700">Rimuovi sfondo (OpenAI)</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={state.aiOptions.styleTransfer}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  aiOptions: { ...prev.aiOptions, styleTransfer: e.target.checked }
                }))}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700">Stile professionale (OpenAI)</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={state.aiOptions.enhanceFace}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  aiOptions: { ...prev.aiOptions, enhanceFace: e.target.checked }
                }))}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700">Migliora volto</span>
            </label>
          </div>

          {state.uploadedImage && (
            <button
              onClick={() => processImageWithAI(dataURLtoFile(state.uploadedImage!, 'photo.jpg'))}
              disabled={state.isProcessing}
              className="mt-4 w-full py-2 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {state.isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Elaborazione...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Applica AI
                </>
              )}
            </button>
          )}
        </div>

        {/* Text Editor */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-600" />
            Testo
          </h3>
          
          <div className="space-y-4">
            {template.layers?.filter(l => l.type === 'text' && l.editable).map(layer => {
              const textConfig = layer.config as import('@/types/template').TextLayerConfig | undefined;
              return (
                <div key={layer.id}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {layer.name}
                  </label>
                  <input
                    type="text"
                    value={state.textOverrides[layer.id] || textConfig?.defaultText || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      textOverrides: { ...prev.textOverrides, [layer.id]: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={textConfig?.defaultText}
                  />
                </div>
              );
            })}`
            
            {(!template.layers || template.layers.filter(l => l.type === 'text').length === 0) && (
              <p className="text-sm text-gray-400">Nessun elemento testo modificabile</p>
            )}
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-600" />
            Colori
          </h3>
          
          <div className="flex gap-2">
            {['#8B2635', '#F4A261', '#2A9D8F', '#264653', '#E76F51'].map(color => (
              <button
                key={color}
                className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-1">{template.name}</p>
          <p>Dimensioni: {template.dimensions.width}×{template.dimensions.height}px</p>
        </div>
      </div>
    </div>
  );
}

// Utility per convertire data URL in File
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
