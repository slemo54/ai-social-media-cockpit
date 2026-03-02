'use client';

import { useState } from 'react';
import TemplateGallery from '@/components/templates/TemplateGallery';
import TemplateEditor from '@/components/templates/TemplateEditor';
import { ChevronLeft, Sparkles } from 'lucide-react';

import type { Template } from '@/types/template';

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {selectedTemplate ? (
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Torna ai template
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Template Studio</h1>
                    <p className="text-xs text-gray-500">Crea contenuti professionali in pochi click</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:inline">
                {selectedTemplate ? 'Modalità Editor' : 'Seleziona un template'}
              </span>
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
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
                <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                <p className="text-gray-500">
                  Personalizza il template caricando la tua foto e modificando il testo
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedTemplate.category === 'IWP' ? 'bg-red-100 text-red-700' :
                selectedTemplate.category === 'IWA' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
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
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 mt-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>
            <span className="font-medium">Dual-API System:</span> OpenAI per editing + Gemini per composizione
          </p>
          <p>
            Figura nera = placeholder per foto utente (stile Thumio)
          </p>
        </div>
      </footer>
    </div>
  );
}
