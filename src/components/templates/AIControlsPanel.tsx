'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors, Palette, Sparkles, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

interface AIControlsPanelProps {
  hasPhoto: boolean;
  isProcessing: boolean;
  onProcess: (options: { removeBackground: boolean; colorGrading: boolean }) => Promise<void>;
  processedPhotoSrc: string | null;
}

export default function AIControlsPanel({
  hasPhoto,
  isProcessing,
  onProcess,
  processedPhotoSrc,
}: AIControlsPanelProps) {
  const [removeBackground, setRemoveBackground] = useState(true);
  const [colorGrading, setColorGrading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleApply = () => {
    if (!removeBackground && !colorGrading) return;
    onProcess({ removeBackground, colorGrading });
  };

  const toggles = [
    {
      id: 'bg-remove',
      label: 'Rimuovi Sfondo',
      description: 'Rimuove lo sfondo dalla foto con AI',
      icon: Scissors,
      checked: removeBackground,
      onChange: setRemoveBackground,
      accentColor: '#003366',
    },
    {
      id: 'color-grade',
      label: 'Color Grading Brand',
      description: 'Applica i toni del brand alla foto',
      icon: Palette,
      checked: colorGrading,
      onChange: setColorGrading,
      accentColor: '#C4A775',
    },
  ];

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#1A1A1A] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#003366] to-[#004A8F] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-[#FAFAFA]">Controllo AI</h3>
            <p className="text-[10px] text-[#525252]">Elaborazione automatica</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#525252]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#525252]" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Toggles */}
              {toggles.map((toggle) => {
                const Icon = toggle.icon;
                return (
                  <label
                    key={toggle.id}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg border transition-all cursor-pointer ${
                      toggle.checked
                        ? 'bg-[#003366]/10 border-[#003366]/30'
                        : 'bg-[#0F0F0F] border-[#262626] hover:border-[#333333]'
                    } ${!hasPhoto ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      toggle.checked ? 'text-[#004A8F]' : 'text-[#525252]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${
                        toggle.checked ? 'text-[#FAFAFA]' : 'text-[#A3A3A3]'
                      }`}>
                        {toggle.label}
                      </p>
                      <p className="text-[10px] text-[#525252] truncate">
                        {toggle.description}
                      </p>
                    </div>
                    {/* Toggle switch */}
                    <div
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        toggle.checked ? 'bg-[#003366]' : 'bg-[#333333]'
                      }`}
                    >
                      <motion.div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                        animate={{ left: toggle.checked ? 18 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={toggle.checked}
                      disabled={!hasPhoto}
                      onChange={(e) => toggle.onChange(e.target.checked)}
                    />
                  </label>
                );
              })}

              {/* Processing indicator */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[#003366]/10 border border-[#003366]/20">
                      <Loader2 className="w-4 h-4 text-[#004A8F] animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-[#FAFAFA]">Elaborazione in corso...</p>
                        <div className="mt-1.5 h-1 bg-[#262626] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#003366] to-[#004A8F] rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 8, ease: 'linear' }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Apply button */}
              <button
                onClick={handleApply}
                disabled={!hasPhoto || isProcessing || (!removeBackground && !colorGrading)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-[#003366] to-[#004A8F] text-white rounded-lg hover:shadow-lg hover:shadow-[#003366]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Elaborazione...
                  </>
                ) : processedPhotoSrc ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Rielabora
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Applica AI
                  </>
                )}
              </button>

              {/* HITL note */}
              <p className="text-[10px] text-[#525252] text-center">
                Dopo l&apos;elaborazione potrai spostare e ridimensionare la foto
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
