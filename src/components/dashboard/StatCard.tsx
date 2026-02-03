'use client';

import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatCard({ label, value, change, changeLabel = 'vs scorso mese', icon: Icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
          <div className="w-16 h-4 bg-white/10 rounded"></div>
        </div>
        <div className="w-24 h-8 bg-white/10 rounded mb-2"></div>
        <div className="w-32 h-4 bg-white/10 rounded"></div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/40" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-white/60';
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-white/60';
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg text-purple-400">
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
      </div>
      <div className="text-sm text-white/60">{label}</div>
      
      {changeLabel && (
        <div className="text-xs text-white/40 mt-2">{changeLabel}</div>
      )}
    </div>
  );
}
