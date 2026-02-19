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
      <div className="bg-white rounded-xl p-6 border border-[#E8E0D8] shadow-sm animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-[#F5EFE7] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const total = templates.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="bg-white rounded-xl p-6 border border-[#E8E0D8] shadow-sm">
      <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Template Più Usati</h3>

      <div className="space-y-3">
        {templates.length === 0 ? (
          <p className="text-[#9B8E82] text-sm">Nessun dato disponibile</p>
        ) : (
          templates.map((template) => {
            const percentage = total > 0 ? (template.count / total) * 100 : 0;
            const icon = templateIcons[template.name] || '📝';

            return (
              <div key={template.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-[#4A4A4A]">
                      {CONTENT_TEMPLATES[template.name]?.name || template.name}
                    </span>
                  </span>
                  <span className="text-[#9B8E82]">{template.count} usi</span>
                </div>
                <div className="h-2 bg-[#F5EFE7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C8956C] to-[#D4AF37] rounded-full transition-all duration-500"
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
