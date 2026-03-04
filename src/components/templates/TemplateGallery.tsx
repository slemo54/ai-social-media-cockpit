'use client';

import { useState, useEffect } from 'react';
import {
  Search, Filter, ImageIcon, AlertCircle
} from 'lucide-react';
import type { Template } from '@/types/template';

interface TemplateWithBaseImage extends Template {
  base_image_url?: string;
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplateId?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'IWP': 'bg-[#7B2D4E] text-white',
  'IWA': 'bg-[#5C2D91] text-white',
  'UNIVERSAL': 'bg-[#374151] text-white',
};

export default function TemplateGallery({
  onSelectTemplate,
  selectedTemplateId,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<TemplateWithBaseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [source, setSource] = useState<'database' | 'static'>('static');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Errore nel caricamento');
      const data = await response.json();
      setTemplates(data.templates || []);
      setSource(data.source || 'static');
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setError('Impossibile caricare i template. Riprova.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = templates.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-[#1A1A1A] animate-pulse rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-[#1A1A1A] animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#FAFAFA]">Template Gallery</h2>
          <p className="text-[#737373] text-sm mt-1">
            Seleziona un template e clicca sulla zona bianca per inserire la tua foto.
          </p>
          {source === 'database' && (
            <span className="inline-block mt-1 text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
              {templates.length} template dal database
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input
            type="text"
            placeholder="Cerca template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#262626] rounded-lg text-[#FAFAFA] placeholder-[#737373] focus:ring-2 focus:ring-[#7B2D4E] focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !categoryFilter
              ? 'bg-[#7B2D4E] text-white'
              : 'bg-[#1A1A1A] text-[#A3A3A3] hover:bg-[#262626] border border-[#262626]'
          }`}
        >
          Tutti ({templates.length})
        </button>
        {(['IWP', 'IWA', 'UNIVERSAL'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoryFilter === cat
                ? CATEGORY_COLORS[cat]
                : 'bg-[#1A1A1A] text-[#A3A3A3] hover:bg-[#262626] border border-[#262626]'
            }`}
          >
            {cat} ({categoryCounts[cat] || 0})
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800/30 rounded-xl text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchTemplates(); }}
            className="ml-auto text-sm text-red-300 hover:text-red-200 underline"
          >
            Riprova
          </button>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.template_id}
            template={template}
            isSelected={selectedTemplateId === template.template_id}
            onClick={() => onSelectTemplate(template)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && !error && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-[#374151] mx-auto mb-4" />
          <p className="text-[#737373]">Nessun template trovato</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm text-[#7B2D4E] hover:underline"
            >
              Cancella ricerca
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: TemplateWithBaseImage;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  const previewImage = !imgError && template.base_image_url
    ? template.base_image_url
    : null;

  return (
    <button
      onClick={onClick}
      className={`group relative rounded-xl overflow-hidden border-2 transition-all text-left ${
        isSelected
          ? 'border-[#7B2D4E] ring-4 ring-[#7B2D4E]/20'
          : 'border-[#262626] hover:border-[#7B2D4E]/50 hover:shadow-lg hover:shadow-black/20'
      }`}
    >
      {/* Preview Image area */}
      <div
        className="relative bg-[#1A1A1A] overflow-hidden"
        style={{ aspectRatio: `${template.dimensions.width}/${template.dimensions.height}` }}
      >
        {previewImage ? (
          <img
            src={previewImage}
            alt={template.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F]" />

            {template.base_assets?.demoFigure && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <img
                  src={template.base_assets.demoFigure}
                  alt="Demo figure"
                  className="max-w-full max-h-full object-contain opacity-20 group-hover:opacity-40 transition-opacity"
                />
              </div>
            )}

            {/* Category color accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                backgroundColor:
                  template.category === 'IWP' ? '#7B2D4E' :
                  template.category === 'IWA' ? '#5C2D91' :
                  '#374151',
              }}
            />

            {!template.base_assets?.demoFigure && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-[#374151]" />
              </div>
            )}
          </>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* "Click to use" label on hover */}
        <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium bg-[#7B2D4E]/90 px-3 py-1 rounded-full">
            Usa questo template
          </span>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-[#7B2D4E] rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* "AI ready" badge */}
        {template.base_image_url && !imgError && (
          <div className="absolute top-3 left-3">
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">
              Pronto
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-[#141414]">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-bold px-2 py-1 rounded ${CATEGORY_COLORS[template.category]}`}>
            {template.category}
          </span>
          <span className="text-xs text-[#737373] capitalize">{template.type}</span>
        </div>
        <h3 className="font-semibold text-[#FAFAFA] group-hover:text-[#D4849E] transition-colors text-sm">
          {template.name}
        </h3>
        <p className="text-xs text-[#737373] mt-1">
          {template.dimensions.width}×{template.dimensions.height}px
        </p>
      </div>
    </button>
  );
}
