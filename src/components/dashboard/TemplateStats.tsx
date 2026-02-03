'use client';

import { CONTENT_TEMPLATES } from '@/lib/abacus';

interface TemplateStatsProps {
  templates: { name: string; count: number }[];
  loading?: boolean;
}

const templateIcons: Record<string, string> = {
  'on-the-road': '🚗',
  'wine-geek': '🤓',
  'wine-geeks': '🤓',
  'cin-cin-community': '🥂',
  'scienza-bite': '🔬',
  'bit-of-scienza': '🔬',
  'behind-scenes': '🎬',
  'behind-the-scenes': '🎬',
  'new-discovery': '✨',
  'wine2wine': '🎤',
  'via-academy': '🎓',
  'wine-basics': '📚',
  'grape-deep-dive': '🍇',
  'region-focus': '🗺️',
  'wine-and-food': '🍽️',
  'study-tips': '💡',
  'wine-career': '💼',
  'sustainability': '🌱',
  'masterclass': '🎓',
};

export function TemplateStats({ templates, loading }: TemplateStatsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const total = templates.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Più Usati</h3>
      
      <div className="space-y-3">
        {templates.length === 0 ? (
          <p className="text-gray-500 text-sm">Nessun dato disponibile</p>
        ) : (
          templates.map((template) => {
            const percentage = total > 0 ? (template.count / total) * 100 : 0;
            const icon = templateIcons[template.name] || '📝';
            
            return (
              <div key={template.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-gray-700">
                      {CONTENT_TEMPLATES[template.name]?.name || template.name}
                    </span>
                  </span>
                  <span className="text-gray-500">{template.count} usi</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
