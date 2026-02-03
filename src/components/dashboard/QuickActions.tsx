'use client';

import Link from 'next/link';
import { CONTENT_TEMPLATES } from '@/lib/abacus';
import { Car, Brain, Users, Microscope, Camera, Sparkles, Mic2, GraduationCap, BookOpen, Grape, MapPin, UtensilsCrossed, Lightbulb, Briefcase, Leaf, Award } from 'lucide-react';

const templateIcons: Record<string, React.ReactNode> = {
  'on-the-road': <Car className="w-5 h-5" />,
  'wine-geek': <Brain className="w-5 h-5" />,
  'wine-geeks': <Brain className="w-5 h-5" />,
  'cin-cin-community': <Users className="w-5 h-5" />,
  'scienza-bite': <Microscope className="w-5 h-5" />,
  'bit-of-scienza': <Microscope className="w-5 h-5" />,
  'behind-scenes': <Camera className="w-5 h-5" />,
  'behind-the-scenes': <Camera className="w-5 h-5" />,
  'new-discovery': <Sparkles className="w-5 h-5" />,
  'wine2wine': <Mic2 className="w-5 h-5" />,
  'via-academy': <GraduationCap className="w-5 h-5" />,
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
      <h2 className="text-lg font-semibold text-white mb-4">Template Rapidi</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(CONTENT_TEMPLATES).map(([key, template]) => (
          <Link
            key={key}
            href={`/?template=${key}`}
            className="flex flex-col items-center p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
              {templateIcons[key] || <Sparkles className="w-5 h-5" />}
            </div>
            <span className="text-xs text-center text-white/70 group-hover:text-purple-300 transition-colors line-clamp-2">
              {template.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
