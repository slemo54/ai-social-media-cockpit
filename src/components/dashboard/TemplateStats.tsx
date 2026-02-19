'use client';

import { CONTENT_TEMPLATES } from '@/lib/abacus';

interface TemplateStatsProps {
  templates: { name: string; count: number }[];
  loading?: boolean;
}

const templateIcons: Record<string, string> = {
  'story-time': '📖',
  'plot-twist': '🔄',
  'on-the-road': '🚗',
  'wine-geek': '🤓',
  'wine-geeks': '🤓',
  'cin-cin-community': '🥂',
  'scienza-bite': '🔬',
  'bit-of-scienza': '🔬',
  'behind-scenes': '🎬',
  'behind-the-scenes': '🎬',
  'new-discovery': '✨',
  'hot-take': '🔥',
  'wine-people': '👥',
  'wine2wine': '🎤',
  'via-academy': '🎓',
  'quiz-educativo': '🧠',
  'last-call': '🔥',
  'five-reasons': '5️⃣',
  'pass-rates': '📊',
  'meet-students': '🎓',
  'wine-facts': '🍇',
  'champagne-specialist': '🍾',
  'corso-info': '📅',
  'behind-the-classroom': '📸',
  'wset-explainer': '📚',
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
      <div className="dashboard-card p-6 animate-pulse">
        <div className="h-6 w-40 bg-[#1A1A1A] rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-[#1A1A1A] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const total = templates.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-lg font-bold text-[#FAFAFA] mb-5">Template Più Usati</h3>

      <div className="space-y-4">
        {templates.length === 0 ? (
          <p className="text-[#737373] text-sm">Nessun dato disponibile</p>
        ) : (
          templates.map((template) => {
            const percentage = total > 0 ? (template.count / total) * 100 : 0;
            const icon = templateIcons[template.name] || '📝';

            return (
              <div key={template.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-[#FAFAFA] font-medium">
                      {CONTENT_TEMPLATES[template.name]?.name || template.name}
                    </span>
                  </span>
                  <span className="text-[#737373] text-xs">{template.count} usi</span>
                </div>
                <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5C2D91] to-[#D4AF37] rounded-full transition-all duration-500"
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
