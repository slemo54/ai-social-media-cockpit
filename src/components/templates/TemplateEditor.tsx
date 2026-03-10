'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Type, Download, RotateCcw, Redo,
  Loader2, ImagePlus, ZoomIn, ZoomOut, RotateCw,
  Info, Check,
} from 'lucide-react';
import type { Template, TextLayerConfig } from '@/types/template';
import type { PhotoTransform } from './TemplateCanvas';
import WizardSteps from './WizardSteps';
import AIControlsPanel from './AIControlsPanel';
import BeforeAfterSlider from './BeforeAfterSlider';

// Dynamic import for Konva (SSR-incompatible)
const TemplateCanvas = dynamic(() => import('./TemplateCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square bg-[#1A1A1A] rounded-xl animate-pulse flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#333333] animate-spin" />
    </div>
  ),
});

// ---------- Types ----------

interface TemplateEditorProps {
  template: Template;
}

interface CanvasState {
  photoTransform: PhotoTransform;
  textOverrides: Record<string, string>;
  processedPhotoSrc: string | null;
}

const DEFAULT_TRANSFORM: PhotoTransform = {
  x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
};

const MAX_HISTORY = 20;

// ---------- Component ----------

export default function TemplateEditor({ template }: TemplateEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  // Wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Photo state
  const [uploadedPhotoSrc, setUploadedPhotoSrc] = useState<string | null>(null);
  const [processedPhotoSrc, setProcessedPhotoSrc] = useState<string | null>(null);
  const [photoTransform, setPhotoTransform] = useState<PhotoTransform>(DEFAULT_TRANSFORM);

  // Text
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});

  // AI processing
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // History (Undo/Redo)
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Container width for responsive canvas
  const [containerWidth, setContainerWidth] = useState(500);

  // Before/After mode
  const [showComparison, setShowComparison] = useState(false);

  // The photo source the canvas actually renders (processed or original)
  const activePhotoSrc = processedPhotoSrc || uploadedPhotoSrc;

  // ---------- Responsive container ----------

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ---------- History helpers ----------

  const pushHistory = useCallback((state: CanvasState) => {
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      sliced.push(state);
      if (sliced.length > MAX_HISTORY) sliced.shift();
      return sliced;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const getCurrentState = useCallback((): CanvasState => ({
    photoTransform,
    textOverrides: { ...textOverrides },
    processedPhotoSrc,
  }), [photoTransform, textOverrides, processedPhotoSrc]);

  const applyState = useCallback((state: CanvasState) => {
    setPhotoTransform(state.photoTransform);
    setTextOverrides(state.textOverrides);
    setProcessedPhotoSrc(state.processedPhotoSrc);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    applyState(history[newIndex]);
  }, [history, historyIndex, applyState]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    applyState(history[newIndex]);
  }, [history, historyIndex, applyState]);

  // ---------- Keyboard shortcuts ----------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // ---------- File upload ----------

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setUploadedPhotoSrc(src);
      setProcessedPhotoSrc(null);
      setPhotoTransform(DEFAULT_TRANSFORM);
      setShowComparison(false);

      // Mark step 1 complete, move to step 2
      setCompletedSteps(prev => new Set([...prev, 1]));
      setCurrentStep(2);

      // Push initial state to history
      pushHistory({
        photoTransform: DEFAULT_TRANSFORM,
        textOverrides: { ...textOverrides },
        processedPhotoSrc: null,
      });
    };
    reader.readAsDataURL(file);

    // Reset input value so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [pushHistory, textOverrides]);

  // ---------- AI Processing ----------

  const handleAIProcess = useCallback(async (options: {
    removeBackground: boolean;
    colorGrading: boolean;
  }) => {
    if (!uploadedPhotoSrc) return;

    setIsProcessingAI(true);

    try {
      const operations: Array<{ type: string }> = [];
      if (options.removeBackground) {
        operations.push({ type: 'remove_background' });
      }
      if (options.colorGrading) {
        operations.push({ type: 'style_transfer' });
      }

      const response = await fetch('/api/image/dual-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedPhotoSrc,
          operations,
          provider: 'auto',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const processedSrc = `data:image/png;base64,${data.imageBase64}`;
        setProcessedPhotoSrc(processedSrc);
        setShowComparison(true);

        // Push to history
        pushHistory({
          photoTransform,
          textOverrides: { ...textOverrides },
          processedPhotoSrc: processedSrc,
        });
      }

      // Mark step 2 complete, move to step 3
      setCompletedSteps(prev => new Set([...prev, 2]));
      setCurrentStep(3);
    } catch (err) {
      console.error('[TemplateEditor] AI processing error:', err);
    } finally {
      setIsProcessingAI(false);
    }
  }, [uploadedPhotoSrc, photoTransform, textOverrides, pushHistory]);

  // ---------- Photo transform changes ----------

  const handlePhotoTransformChange = useCallback((t: PhotoTransform) => {
    setPhotoTransform(t);
    // Debounced history push: we push only on drag-end / final change
    pushHistory({
      photoTransform: t,
      textOverrides: { ...textOverrides },
      processedPhotoSrc,
    });
  }, [textOverrides, processedPhotoSrc, pushHistory]);

  // ---------- Text changes ----------

  const handleTextOverrideChange = useCallback((layerId: string, value: string) => {
    setTextOverrides(prev => ({ ...prev, [layerId]: value }));
  }, []);

  const handleTextChange = useCallback((layerId: string, value: string) => {
    setTextOverrides(prev => {
      const updated = { ...prev, [layerId]: value };
      pushHistory({
        photoTransform,
        textOverrides: updated,
        processedPhotoSrc,
      });
      return updated;
    });
  }, [photoTransform, processedPhotoSrc, pushHistory]);

  // ---------- Wizard navigation ----------

  const handleStepClick = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const skipToStep3 = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, 2]));
    setCurrentStep(3);
  }, []);

  // ---------- Zoom / Rotate controls ----------

  const handleZoomIn = () => {
    const newScale = Math.min(5, photoTransform.scaleX * 1.15);
    handlePhotoTransformChange({ ...photoTransform, scaleX: newScale, scaleY: newScale });
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.2, photoTransform.scaleX * 0.85);
    handlePhotoTransformChange({ ...photoTransform, scaleX: newScale, scaleY: newScale });
  };

  const handleRotate = () => {
    handlePhotoTransformChange({
      ...photoTransform,
      rotation: (photoTransform.rotation + 15) % 360,
    });
  };

  // ---------- Reset ----------

  const handleReset = useCallback(() => {
    setUploadedPhotoSrc(null);
    setProcessedPhotoSrc(null);
    setPhotoTransform(DEFAULT_TRANSFORM);
    setTextOverrides({});
    setHistory([]);
    setHistoryIndex(-1);
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setShowComparison(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ---------- Export ----------

  const handleExport = useCallback(() => {
    // Use the Konva stage ref for high-res export
    const stage = stageRef.current;
    if (!stage) return;

    const pixelRatio = template.dimensions.width / containerWidth;
    const dataURL = stage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
      quality: 1,
    });

    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `${template.template_id}-export-${Date.now()}.png`;
    a.click();

    setCompletedSteps(prev => new Set([...prev, 4]));
  }, [template, containerWidth]);

  // Fallback export from composited canvas data URL
  const handleExportFallback = useCallback(() => {
    // If we don't have a Konva stage ref, try to composite via offscreen canvas
    const bgSrc = template.base_assets?.background || template.base_image_url;
    const photoSrc = activePhotoSrc;
    if (!bgSrc || !photoSrc) return;

    const canvas = document.createElement('canvas');
    canvas.width = template.dimensions.width;
    canvas.height = template.dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      const userImg = new Image();
      userImg.crossOrigin = 'anonymous';
      userImg.onload = () => {
        const zone = template.photoZone;
        ctx.save();

        if (zone?.type === 'circle' && zone.centerX && zone.centerY && zone.radius) {
          ctx.beginPath();
          ctx.arc(zone.centerX, zone.centerY, zone.radius, 0, Math.PI * 2);
          ctx.clip();
          const s = zone.radius * 2;
          const imgA = userImg.width / userImg.height;
          const dw = imgA > 1 ? s * imgA : s;
          const dh = imgA > 1 ? s : s / imgA;
          ctx.drawImage(userImg,
            (photoTransform.x || zone.centerX - dw / 2),
            (photoTransform.y || zone.centerY - dh / 2),
            dw * photoTransform.scaleX,
            dh * photoTransform.scaleY,
          );
        } else if (zone && zone.x != null && zone.y != null && zone.width && zone.height) {
          ctx.beginPath();
          ctx.rect(zone.x, zone.y, zone.width, zone.height);
          ctx.clip();
          const za = zone.width / zone.height;
          const ia = userImg.width / userImg.height;
          const dw = ia > za ? zone.height * ia : zone.width;
          const dh = ia > za ? zone.height : zone.width / ia;
          ctx.drawImage(userImg,
            (photoTransform.x || zone.x + (zone.width - dw) / 2),
            (photoTransform.y || zone.y + (zone.height - dh) / 2),
            dw * photoTransform.scaleX,
            dh * photoTransform.scaleY,
          );
        } else {
          const sz = Math.min(canvas.width, canvas.height) * 0.6;
          ctx.drawImage(userImg,
            (canvas.width - sz) / 2,
            (canvas.height - sz) / 2,
            sz, sz,
          );
        }
        ctx.restore();

        // Draw text layers
        template.layers?.filter(l => l.type === 'text' && l.editable).forEach(layer => {
          const cfg = layer.config as TextLayerConfig | undefined;
          if (!cfg) return;
          const text = textOverrides[layer.id] || cfg.defaultText;
          if (!text) return;
          const pos = cfg.position || layer.position;
          if (!pos) return;

          ctx.save();
          ctx.font = `${cfg.fontSize}px ${cfg.fontFamily}`;
          ctx.fillStyle = cfg.color || '#FFFFFF';
          ctx.textAlign = (cfg.alignment as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 4;
          ctx.fillText(text, pos.x, pos.y);
          ctx.restore();
        });

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${template.template_id}-export-${Date.now()}.png`;
        a.click();

        setCompletedSteps(prev => new Set([...prev, 4]));
      };
      userImg.src = photoSrc;
    };
    bgImg.src = bgSrc;
  }, [template, activePhotoSrc, photoTransform, textOverrides]);

  // ---------- Editable text layers ----------

  const textLayers = useMemo(() => {
    return (template.layers || []).filter(l => l.type === 'text' && l.editable);
  }, [template.layers]);

  // ---------- Render ----------

  return (
    <div className="flex flex-col gap-6">
      {/* Wizard Steps */}
      <div className="px-2">
        <WizardSteps
          currentStep={currentStep}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main layout: 3-column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT PANEL: AI Controls + Info */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          {/* AI Controls */}
          <AIControlsPanel
            hasPhoto={!!uploadedPhotoSrc}
            isProcessing={isProcessingAI}
            onProcess={handleAIProcess}
            processedPhotoSrc={processedPhotoSrc}
          />

          {/* Photo controls (zoom/rotate) */}
          {uploadedPhotoSrc && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-4"
            >
              <h4 className="text-xs font-semibold text-[#A3A3A3] mb-3 flex items-center gap-2">
                <ImagePlus className="w-3.5 h-3.5" />
                Posizione Foto
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleZoomIn}
                  className="flex flex-col items-center gap-1 p-2 bg-[#0F0F0F] hover:bg-[#1A1A1A] text-[#A3A3A3] hover:text-white rounded-lg border border-[#262626] transition-all"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span className="text-[9px]">Zoom +</span>
                </button>
                <button
                  onClick={handleZoomOut}
                  className="flex flex-col items-center gap-1 p-2 bg-[#0F0F0F] hover:bg-[#1A1A1A] text-[#A3A3A3] hover:text-white rounded-lg border border-[#262626] transition-all"
                >
                  <ZoomOut className="w-4 h-4" />
                  <span className="text-[9px]">Zoom -</span>
                </button>
                <button
                  onClick={handleRotate}
                  className="flex flex-col items-center gap-1 p-2 bg-[#0F0F0F] hover:bg-[#1A1A1A] text-[#A3A3A3] hover:text-white rounded-lg border border-[#262626] transition-all"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[9px]">Ruota</span>
                </button>
              </div>
              <p className="text-[10px] text-[#525252] mt-2 text-center">
                Trascina la foto nel canvas • Scroll per zoom
              </p>
            </motion.div>
          )}

          {/* Workflow guide */}
          <div className="bg-[#003366]/5 border border-[#003366]/15 rounded-xl p-4">
            <p className="font-semibold text-[#004A8F] mb-2 text-xs flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Come si usa
            </p>
            <ol className="space-y-1.5 text-[#737373] text-[10px] list-decimal list-inside">
              <li>Clicca sulla zona del template o su &quot;Carica Foto&quot;</li>
              <li>Opzionale: attiva AI per rimuovere sfondo o correggere i colori</li>
              <li>Trascina, zooma e ruota la foto dentro la maschera</li>
              <li>Modifica i testi nella sidebar o direttamente sul canvas (doppio click)</li>
              <li>Esporta il risultato finale in alta risoluzione</li>
            </ol>
          </div>
        </div>

        {/* CENTER: Canvas / Before-After */}
        <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
          {/* Canvas container */}
          <div ref={canvasContainerRef} className="w-full">
            <AnimatePresence mode="wait">
              {showComparison && uploadedPhotoSrc && processedPhotoSrc ? (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <BeforeAfterSlider
                    beforeSrc={uploadedPhotoSrc}
                    afterSrc={processedPhotoSrc}
                    className="w-full"
                  />
                  <div className="flex justify-center gap-3 mt-3">
                    <button
                      onClick={() => setShowComparison(false)}
                      className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-[#003366] to-[#004A8F] text-white rounded-lg hover:shadow-lg hover:shadow-[#003366]/30 transition-all"
                    >
                      <Check className="w-3.5 h-3.5 inline mr-1.5" />
                      Conferma e continua
                    </button>
                    <button
                      onClick={() => {
                        setProcessedPhotoSrc(null);
                        setShowComparison(false);
                      }}
                      className="px-4 py-2 text-xs font-medium bg-[#1A1A1A] text-[#A3A3A3] border border-[#262626] rounded-lg hover:bg-[#262626] transition-all"
                    >
                      Usa originale
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TemplateCanvas
                    template={template}
                    photoSrc={activePhotoSrc}
                    photoTransform={photoTransform}
                    textOverrides={textOverrides}
                    containerWidth={containerWidth}
                    onPhotoTransformChange={handlePhotoTransformChange}
                    onTextChange={handleTextChange}
                    onClickPlaceholder={() => fileInputRef.current?.click()}
                    interactive={currentStep >= 3 || (!processedPhotoSrc && currentStep >= 1)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Processing skeleton overlay */}
          <AnimatePresence>
            {isProcessingAI && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-[#141414] border border-[#262626] rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#003366] to-[#004A8F] flex items-center justify-center shadow-lg shadow-[#003366]/30">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-[#FAFAFA]">Elaborazione AI</h3>
                      <p className="text-sm text-[#737373] mt-1">
                        Stiamo processando la tua foto...
                      </p>
                    </div>
                    {/* Skeleton progress */}
                    <div className="w-full space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#003366] animate-pulse" />
                        <div className="h-2 flex-1 bg-[#262626] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#003366] to-[#C4A775] rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 10, ease: 'linear' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#003366] to-[#004A8F] text-white rounded-lg hover:shadow-lg hover:shadow-[#003366]/30 transition-all text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              {uploadedPhotoSrc ? 'Cambia Foto' : 'Carica Foto'}
            </button>

            {/* Skip AI step */}
            {currentStep === 2 && uploadedPhotoSrc && !processedPhotoSrc && (
              <button
                onClick={skipToStep3}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-[#A3A3A3] border border-[#262626] rounded-lg hover:bg-[#262626] transition-all text-sm"
              >
                Salta AI →
              </button>
            )}

            <div className="flex-1" />

            {/* Undo / Redo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2.5 text-[#525252] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] rounded-lg transition-all disabled:opacity-20"
              title="Annulla (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2.5 text-[#525252] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] rounded-lg transition-all disabled:opacity-20"
              title="Ripristina (Ctrl+Shift+Z)"
            >
              <Redo className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              disabled={!uploadedPhotoSrc}
              className="p-2.5 text-[#525252] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-20"
              title="Reset tutto"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Export */}
            <button
              onClick={handleExportFallback}
              disabled={!activePhotoSrc || isProcessingAI}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FAFAFA] text-[#0F0F0F] rounded-lg hover:bg-[#E5E5E5] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Esporta PNG
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Text editor + Template info */}
        <div className="lg:col-span-3 space-y-4 order-3">
          {/* Text Editor */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
            <h3 className="font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2 text-sm">
              <Type className="w-4 h-4 text-[#C4A775]" />
              Testo
            </h3>
            <div className="space-y-3">
              {textLayers.map(layer => {
                const textConfig = layer.config as TextLayerConfig | undefined;
                return (
                  <div key={layer.id}>
                    <label className="block text-[10px] font-medium text-[#525252] mb-1 uppercase tracking-wider">
                      {layer.name}
                    </label>
                    <input
                      type="text"
                      value={textOverrides[layer.id] || ''}
                      onChange={(e) => handleTextOverrideChange(layer.id, e.target.value)}
                      onBlur={() => {
                        pushHistory(getCurrentState());
                      }}
                      className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#262626] rounded-lg text-sm text-[#FAFAFA] placeholder-[#525252] focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                      placeholder={textConfig?.defaultText || 'Inserisci testo...'}
                    />
                  </div>
                );
              })}

              {textLayers.length === 0 && (
                <p className="text-xs text-[#525252]">Nessun campo testo editabile</p>
              )}

              {textLayers.length > 0 && (
                <p className="text-[10px] text-[#525252] mt-1">
                  💡 Puoi anche fare doppio click sul testo nel canvas per modificarlo inline
                </p>
              )}
            </div>
          </div>

          {/* Template info */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-sm">
            <p className="font-semibold text-[#FAFAFA] mb-1">{template.name}</p>
            <p className="text-[10px] text-[#525252]">
              {template.dimensions.width}×{template.dimensions.height}px
            </p>
            {template.photoZone?.type === 'circle' && (
              <p className="text-[10px] text-[#525252] mt-0.5">
                Maschera: cerchio {(template.photoZone.radius || 0) * 2}px
              </p>
            )}
            {(template.photoZone?.type === 'rectangle' || template.photoZone?.type === 'rect') && (
              <p className="text-[10px] text-[#525252] mt-0.5">
                Maschera: rettangolo {template.photoZone.width}×{template.photoZone.height}px
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#003366]/20 text-[#004A8F]">
                {template.category}
              </span>
              <span className="capitalize text-[10px] text-[#525252]">{template.type}</span>
            </div>

            {activePhotoSrc && (
              <p className="mt-3 text-green-400 text-[10px] flex items-center gap-1">
                <Check className="w-3 h-3" />
                Pronto per l&apos;esportazione
              </p>
            )}
          </div>

          {/* Keyboard shortcuts */}
          <div className="bg-[#0F0F0F] border border-[#262626] rounded-xl p-4">
            <h4 className="text-[10px] font-semibold text-[#525252] mb-2 uppercase tracking-wider">
              Scorciatoie tastiera
            </h4>
            <div className="space-y-1.5">
              {[
                { keys: '⌘Z', label: 'Annulla' },
                { keys: '⌘⇧Z', label: 'Ripristina' },
                { keys: 'Scroll', label: 'Zoom foto' },
                { keys: 'Drag', label: 'Sposta foto' },
                { keys: 'Dbl Click', label: 'Modifica testo' },
              ].map(({ keys, label }) => (
                <div key={keys} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#525252]">{label}</span>
                  <kbd className="text-[9px] px-1.5 py-0.5 bg-[#1A1A1A] border border-[#262626] rounded text-[#737373] font-mono">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
