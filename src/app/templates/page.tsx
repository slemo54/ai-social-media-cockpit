'use client';

import { useState } from 'react';
import TemplateGallery from '@/components/templates/TemplateGallery';
import TemplateEditor from '@/components/templates/TemplateEditor';
import { ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

import type { Template } from '@/types/template';

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Header */}
      <header className="bg-[#141414]/95 backdrop-blur-md border-b border-[#262626] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {selectedTemplate ? (
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex items-center gap-2 text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Torna ai template
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#7B2D4E] to-[#C8956C] rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#FAFAFA]">Template Studio</h1>
                    <p className="text-xs text-[#737373]">Crea contenuti professionali in pochi click</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-[#737373] hover:text-[#FAFAFA] transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-sm text-[#737373] hidden sm:inline">
                {selectedTemplate ? 'Modalità Editor' : 'Seleziona un template'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTemplate ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#FAFAFA]">{selectedTemplate.name}</h2>
                <p className="text-[#A3A3A3]">
                  Personalizza il template caricando la tua foto e modificando il testo
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedTemplate.category === 'IWP' ? 'bg-[#7B2D4E]/20 text-[#D4849E]' :
                selectedTemplate.category === 'IWA' ? 'bg-[#5C2D91]/20 text-[#B088D4]' :
                'bg-[#262626] text-[#A3A3A3]'
              }`}>
                {selectedTemplate.category}
              </span>
            </div>

            <TemplateEditor template={selectedTemplate} />
          </div>
        ) : (
          <TemplateGallery
            onSelectTemplate={setSelectedTemplate}
            selectedTemplateId={undefined}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-[#262626] mt-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#737373]">
          <p>
            <span className="font-medium text-[#A3A3A3]">Dual-API System:</span> OpenAI per editing + Gemini per composizione
          </p>
          <p>
            Upload foto → compositing istantaneo → AI opzionale
          </p>
        </div>
      </footer>
    </div>
  );
}
