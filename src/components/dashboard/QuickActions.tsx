'use client';

import Link from 'next/link';
import { CONTENT_TEMPLATES } from '@/lib/abacus';
import { Car, Brain, Users, Microscope, Camera, Sparkles, Mic2, GraduationCap, BookOpen, Grape, MapPin, UtensilsCrossed, Lightbulb, Briefcase, Leaf, Award, Flame, Zap } from 'lucide-react';

const templateIcons: Record<string, React.ReactNode> = {
  'story-time': <BookOpen className="w-5 h-5" />,
  'plot-twist': <Zap className="w-5 h-5" />,
  'on-the-road': <Car className="w-5 h-5" />,
  'wine-geek': <Brain className="w-5 h-5" />,
  'wine-geeks': <Brain className="w-5 h-5" />,
  'cin-cin-community': <Users className="w-5 h-5" />,
  'scienza-bite': <Microscope className="w-5 h-5" />,
  'bit-of-scienza': <Microscope className="w-5 h-5" />,
  'behind-scenes': <Camera className="w-5 h-5" />,
  'behind-the-scenes': <Camera className="w-5 h-5" />,
  'new-discovery': <Sparkles className="w-5 h-5" />,
  'hot-take': <Flame className="w-5 h-5" />,
  'wine-people': <Users className="w-5 h-5" />,
  'wine2wine': <Mic2 className="w-5 h-5" />,
  'via-academy': <GraduationCap className="w-5 h-5" />,
  'quiz-educativo': <Brain className="w-5 h-5" />,
  'last-call': <Flame className="w-5 h-5" />,
  'five-reasons': <Lightbulb className="w-5 h-5" />,
  'pass-rates': <Award className="w-5 h-5" />,
  'meet-students': <GraduationCap className="w-5 h-5" />,
  'wine-facts': <Grape className="w-5 h-5" />,
  'champagne-specialist': <Sparkles className="w-5 h-5" />,
  'corso-info': <BookOpen className="w-5 h-5" />,
  'behind-the-classroom': <Camera className="w-5 h-5" />,
  'wset-explainer': <BookOpen className="w-5 h-5" />,
  'wine-basics': <BookOpen className="w-5 h-5" />,
  'grape-deep-dive': <Grape className="w-5 h-5" />,
  'region-focus': <MapPin className="w-5 h-5" />,
  'wine-and-food': <UtensilsCrossed className="w-5 h-5" />,
  'study-tips': <Lightbulb className="w-5 h-5" />,
  'wine-career': <Briefcase className="w-5 h-5" />,
  'sustainability': <Leaf className="w-5 h-5" />,
  'masterclass': <Award className="w-5 h-5" />,
};

export function QuickActions() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-[#FAFAFA]">Template Rapidi</h2>
        <p className="text-sm text-[#737373]">Clicca per iniziare con un template</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(CONTENT_TEMPLATES).map(([key, template]) => (
          <Link
            key={key}
            href={`/generate?template=${key}`}
            className="flex flex-col items-center p-4 bg-[#141414] border border-[#262626] rounded-xl hover:border-[#003366]/50 hover:bg-[#1A1A1A] transition-all group"
          >
            <div className="w-11 h-11 bg-[#003366]/10 rounded-xl flex items-center justify-center text-[#004A8F] mb-3 group-hover:scale-110 group-hover:bg-[#003366]/20 transition-all">
              {templateIcons[key] || <Sparkles className="w-5 h-5" />}
            </div>
            <span className="text-xs text-center text-[#A3A3A3] group-hover:text-[#FAFAFA] transition-colors line-clamp-2">
              {template.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
