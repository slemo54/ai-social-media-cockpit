'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Mic, Calendar, Megaphone, GraduationCap, 
  BookOpen, Layout, Search, Filter 
} from 'lucide-react';
import type { Template } from '@/types/template';

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplateId?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'iwp-podcast': <Mic className="w-4 h-4" />,
  'iwp-events': <Calendar className="w-4 h-4" />,
  'iwp-promo': <Megaphone className="w-4 h-4" />,
  'iwa-courses': <GraduationCap className="w-4 h-4" />,
  'iwa-educational': <BookOpen className="w-4 h-4" />,
  'universal': <Layout className="w-4 h-4" />
};

const CATEGORY_COLORS: Record<string, string> = {
  'IWP': 'bg-red-600 text-white',
  'IWA': 'bg-orange-500 text-white',
  'UNIVERSAL': 'bg-gray-700 text-white'
};

export default function TemplateGallery({ 
  onSelectTemplate, 
  selectedTemplateId 
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      // Fallback static
      setTemplates(getStaticTemplates());
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Gallery</h2>
          <p className="text-gray-500 text-sm mt-1">
            Seleziona un template per iniziare. La figura nera indica dove inserire la tua foto.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !categoryFilter ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tutti
        </button>
        {['IWP', 'IWA', 'UNIVERSAL'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoryFilter === cat 
                ? CATEGORY_COLORS[cat] 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

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

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nessun template trovato</p>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ 
  template, 
  isSelected, 
  onClick 
}: { 
  template: Template; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const aspectRatio = template.dimensions.height / template.dimensions.width;
  const isPortrait = aspectRatio > 1;
  
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
        isSelected 
          ? 'border-purple-600 ring-4 ring-purple-100' 
          : 'border-gray-200 hover:border-purple-300 hover:shadow-lg'
      }`}
    >
      {/* Preview Image */}
      <div 
        className="relative bg-gray-50 overflow-hidden"
        style={{ aspectRatio: `${template.dimensions.width}/${template.dimensions.height}` }}
      >
        {/* Demo Figure Placeholder */}
        {template.base_assets?.demoFigure && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <img
              src={template.base_assets.demoFigure}
              alt="Demo figure"
              className="max-w-full max-h-full object-contain opacity-40 group-hover:opacity-60 transition-opacity"
            />
          </div>
        )}
        
        {/* Background preview se disponibile */}
        {template.base_assets?.background && (
          <div 
            className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity"
            style={{
              backgroundImage: `url(${template.base_assets.background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="p-4 text-left">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-bold px-2 py-1 rounded ${CATEGORY_COLORS[template.category]}`}>
            {template.category}
          </span>
          <span className="text-xs text-gray-500 capitalize">{template.type}</span>
        </div>
        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
          {template.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {template.dimensions.width}×{template.dimensions.height}px
        </p>
      </div>
    </button>
  );
}

// Fallback static templates
function getStaticTemplates(): Template[] {
  return [
    {
      template_id: 'iwp-ambassador-circle',
      name: "Ambassador's Corner",
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1080, height: 1080, format: 'square' },
      base_assets: { demoFigure: '/templates/assets/demo-figure-circle.png' }
    },
    {
      template_id: 'iwp-masterclass-duo',
      name: 'Masterclass Duo',
      category: 'IWP',
      type: 'event',
      dimensions: { width: 1080, height: 1080, format: 'square' },
      base_assets: { demoFigure: '/templates/assets/demo-figure-duo.png' }
    },
    {
      template_id: 'iwa-wset-level1',
      name: 'WSET Level 1',
      category: 'IWA',
      type: 'course',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      base_assets: { demoFigure: '/templates/assets/demo-figure-portrait.png' }
    },
    {
      template_id: 'thm-minimal-bordeaux',
      name: 'Minimal Bordeaux',
      category: 'UNIVERSAL',
      type: 'portrait',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      base_assets: { demoFigure: '/templates/assets/demo-figure-portrait.png' }
    },
    {
      template_id: 'thm-line-art-toast',
      name: 'Line Art Toast',
      category: 'UNIVERSAL',
      type: 'quote',
      dimensions: { width: 1080, height: 1350, format: 'portrait' },
      base_assets: {}
    }
  ];
}
