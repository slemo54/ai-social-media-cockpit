'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Type,
  Wand2, Download, RotateCcw, Check,
  Loader2, Eye, EyeOff,
  Scissors, Sparkles, User, ImagePlus,
} from 'lucide-react';
import type { Template } from '@/types/template';

interface TemplateEditorProps {
  template: Template;
}

interface ProcessingStep {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

const AI_STEPS: ProcessingStep[] = [
  { label: 'Rimozione sfondo (AI)...', status: 'pending' },
  { label: 'Compositing nel template', status: 'pending' },
];

export default function TemplateEditor({ template }: TemplateEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [compositedSrc, setCompositedSrc] = useState<string | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>(AI_STEPS);
  const [showOriginal, setShowOriginal] = useState(false);
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});
  const [bgImageLoaded, setBgImageLoaded] = useState(false);

  const updateStep = useCallback((index: number, status: ProcessingStep['status']) => {
    setProcessingSteps(prev =>
      prev.map((step, i) => i === index ? { ...step, status } : step)
    );
  }, []);

  /**
   * Composita la foto nel template usando Canvas HTML5.
   * Ritaglia la foto nella forma (cerchio o rettangolo) del photoZone.
   */
  const compositeIntoTemplate = useCallback(async (
    photoSrc: string,
    bgSrc: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = template.dimensions.width;
      canvas.height = template.dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not available'));

      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        const zone = template.photoZone;
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';

        userImg.onload = () => {
          if (!zone) {
            // Nessuna zona definita — foto centrata
            const size = Math.min(canvas.width, canvas.height) * 0.6;
            ctx.drawImage(userImg, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size);
            return resolve(canvas.toDataURL('image/png'));
          }

          ctx.save();

          const imgAspect = userImg.width / userImg.height;

          if (zone.type === 'circle' && zone.centerX && zone.centerY && zone.radius) {
            const { centerX, centerY, radius } = zone;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();

            const circleSize = radius * 2;
            let drawW, drawH;
            if (imgAspect > 1) { drawH = circleSize; drawW = circleSize * imgAspect; }
            else { drawW = circleSize; drawH = circleSize / imgAspect; }
            ctx.drawImage(userImg, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);

          } else if ((zone.type === 'rectangle' || (zone as any).type === 'rect') && zone.x != null && zone.y != null && zone.width && zone.height) {
            const { x, y, width: zw, height: zh } = zone as { x: number; y: number; width: number; height: number; type: string };
            ctx.beginPath();
            ctx.rect(x, y, zw, zh);
            ctx.clip();

            const zoneAspect = zw / zh;
            let drawW, drawH;
            if (imgAspect > zoneAspect) { drawH = zh; drawW = zh * imgAspect; }
            else { drawW = zw; drawH = zw / imgAspect; }
            ctx.drawImage(userImg, x + (zw - drawW) / 2, y + (zh - drawH) / 2, drawW, drawH);
          }

          ctx.restore();
          resolve(canvas.toDataURL('image/png'));
        };

        userImg.onerror = reject;
        userImg.src = photoSrc;
      };
      bgImg.onerror = reject;
      bgImg.src = bgSrc;
    });
  }, [template]);

  /**
   * Upload foto → compositing istantaneo (no AI).
   * Il bottone "Rimuovi Sfondo" fa la parte AI su richiesta.
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCompositedSrc(null);
    setShowOriginal(false);
    setProcessingSteps(AI_STEPS.map(s => ({ ...s, status: 'pending' })));

    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target?.result as string;
      setUploadedImageSrc(src);

      const bgSrc = template.base_assets?.background || template.base_image_url;
      if (!bgSrc) return;

      try {
        const composited = await compositeIntoTemplate(src, bgSrc);
        setCompositedSrc(composited);
      } catch (err) {
        console.error('[TemplateEditor] Compositing error:', err);
      }
    };
    reader.readAsDataURL(file);
  }, [template, compositeIntoTemplate]);

  /**
   * Rimuovi Sfondo AI → su richiesta esplicita dell'utente.
   */
  const handleRemoveBg = useCallback(async () => {
    if (!uploadedImageSrc) return;
    const bgSrc = template.base_assets?.background || template.base_image_url;
    if (!bgSrc) return;

    setIsProcessingAI(true);
    setProcessingSteps(AI_STEPS.map(s => ({ ...s, status: 'pending' })));
    updateStep(0, 'active');

    try {
      const response = await fetch('/api/image/dual-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImageSrc,
          operations: [{ type: 'remove_background' }],
          provider: 'auto',
        }),
      });

      const photoSrc = response.ok
        ? `data:image/png;base64,${(await response.json()).imageBase64}`
        : uploadedImageSrc;

      updateStep(0, response.ok ? 'done' : 'error');
      updateStep(1, 'active');

      const composited = await compositeIntoTemplate(photoSrc, bgSrc);
      setCompositedSrc(composited);
      updateStep(1, 'done');
    } catch (err) {
      console.error('[TemplateEditor] BG removal error:', err);
      updateStep(0, 'error');
    } finally {
      setIsProcessingAI(false);
    }
  }, [uploadedImageSrc, template, compositeIntoTemplate, updateStep]);

  const handleReset = useCallback(() => {
    setUploadedImageSrc(null);
    setCompositedSrc(null);
    setProcessingSteps(AI_STEPS.map(s => ({ ...s, status: 'pending' })));
    setShowOriginal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleDownload = useCallback(() => {
    const src = compositedSrc || uploadedImageSrc;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `${template.template_id}-export.png`;
    a.click();
  }, [compositedSrc, uploadedImageSrc, template.template_id]);

  const previewSrc = showOriginal ? uploadedImageSrc : (compositedSrc || uploadedImageSrc);
  const bgSrc = template.base_assets?.background || template.base_image_url;
  const hasResult = !!compositedSrc;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Preview */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center min-h-[500px]">
          <div
            className="relative shadow-2xl overflow-hidden select-none"
            style={{
              width: '100%',
              maxWidth: '500px',
              aspectRatio: `${template.dimensions.width}/${template.dimensions.height}`,
            }}
          >
            {previewSrc ? (
              <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
            ) : bgSrc ? (
              <div className="relative w-full h-full">
                <img
                  src={bgSrc}
                  alt="Template base"
                  className="w-full h-full object-cover"
                  onLoad={() => setBgImageLoaded(true)}
                />
                {/* Click sulla zona bianca per caricare la foto */}
                {bgImageLoaded && template.photoZone?.type === 'circle' && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute group"
                    style={(() => {
                      const z = template.photoZone!;
                      const pct = (v: number, dim: number) => `${(v / dim) * 100}%`;
                      const r = pct(z.radius! * 2, template.dimensions.width);
                      return {
                        left: `calc(${pct(z.centerX!, template.dimensions.width)} - ${r} / 2)`,
                        top: `calc(${pct(z.centerY!, template.dimensions.height)} - ${r} / 2 * ${template.dimensions.width / template.dimensions.height})`,
                        width: r,
                        aspectRatio: '1',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      };
                    })()}
                    title="Clicca per caricare la foto"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-full w-full h-full flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3 shadow">
                        <ImagePlus className="w-6 h-6 text-gray-700" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-center text-gray-400 hover:text-[#7B2D4E] transition-colors"
                >
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 hover:border-[#7B2D4E] flex items-center justify-center mx-auto mb-2 transition-colors">
                    <User className="w-8 h-8" />
                  </div>
                  <p className="text-sm">Carica foto ospite</p>
                </button>
              </div>
            )}

            {/* AI Processing Overlay */}
            {isProcessingAI && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6">
                <div className="bg-white rounded-xl p-6 w-full max-w-[260px] space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#7B2D4E]" />
                    <span className="font-semibold text-gray-800 text-sm">Elaborazione AI</span>
                  </div>
                  {processingSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {step.status === 'done'    && <Check   className="w-4 h-4 text-green-500" />}
                        {step.status === 'active'  && <Loader2 className="w-4 h-4 animate-spin text-[#7B2D4E]" />}
                        {step.status === 'error'   && <span className="text-red-400 text-xs">✕</span>}
                        {step.status === 'pending' && <div className="w-3 h-3 rounded-full bg-gray-200" />}
                      </div>
                      <span className={`text-xs ${
                        step.status === 'done'    ? 'text-green-600' :
                        step.status === 'active'  ? 'text-[#7B2D4E] font-medium' :
                        step.status === 'error'   ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Before/After toggle */}
        {hasResult && uploadedImageSrc && (
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowOriginal(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
            >
              {showOriginal
                ? <><Eye className="w-4 h-4" /> Mostra risultato</>
                : <><EyeOff className="w-4 h-4" /> Vedi foto originale</>
              }
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#7B2D4E] text-white rounded-lg hover:bg-[#6a2442] transition-colors"
          >
            <Upload className="w-4 h-4" />
            {uploadedImageSrc ? 'Cambia Foto' : 'Carica Foto Ospite'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={handleReset}
            disabled={!uploadedImageSrc}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={handleDownload}
            disabled={!compositedSrc || isProcessingAI}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Esporta
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* AI Background Removal — bottone on-demand */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#7B2D4E]" />
            AI Photo
          </h3>

          <p className="text-xs text-gray-500 mb-4">
            Rimuovi automaticamente lo sfondo dalla foto prima di inserirla nel template.
          </p>

          <button
            onClick={handleRemoveBg}
            disabled={!uploadedImageSrc || isProcessingAI}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#7B2D4E] text-white rounded-lg hover:bg-[#6a2442] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isProcessingAI
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Elaborazione...</>
              : <><Scissors className="w-4 h-4" /> Rimuovi Sfondo</>
            }
          </button>
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
                    value={textOverrides[layer.id] || ''}
                    onChange={(e) => setTextOverrides(prev => ({ ...prev, [layer.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7B2D4E] focus:border-transparent"
                    placeholder={textConfig?.defaultText}
                  />
                </div>
              );
            })}
            {(!template.layers || template.layers.filter(l => l.type === 'text').length === 0) && (
              <p className="text-sm text-gray-400">Nessun elemento testo</p>
            )}
          </div>
        </div>

        {/* Workflow guide */}
        <div className="bg-[#FFF8F5] border border-[#C8956C]/30 rounded-xl p-4 text-sm">
          <p className="font-semibold text-[#7B2D4E] mb-2">Come si usa</p>
          <ol className="space-y-1.5 text-gray-600 text-xs list-decimal list-inside">
            <li>Clicca sul cerchio bianco o su "Carica Foto"</li>
            <li>La foto viene inserita immediatamente nel template</li>
            <li>Opzionale: clicca "Rimuovi Sfondo" per usare l'AI</li>
            <li>Inserisci il nome dell'ospite e scarica</li>
          </ol>
        </div>

        {/* Template info */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-1">{template.name}</p>
          <p className="text-xs">{template.dimensions.width}×{template.dimensions.height}px</p>
          {template.photoZone?.type === 'circle' && (
            <p className="text-xs text-gray-400 mt-1">
              Zona: cerchio Ø{template.photoZone.radius! * 2}px
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-[#7B2D4E]/10 text-[#7B2D4E]">
              {template.category}
            </span>
            <span className="capitalize text-xs">{template.type}</span>
          </div>
          {hasResult && (
            <p className="mt-2 text-green-600 text-xs flex items-center gap-1">
              <Check className="w-3 h-3" /> Pronto per l'esportazione
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
