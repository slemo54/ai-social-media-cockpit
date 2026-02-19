'use client';

import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  loading?: boolean;
  variant?: 'purple' | 'red' | 'gold' | 'green' | 'default';
}

export function StatCard({ label, value, change, changeLabel = 'vs scorso mese', icon: Icon, loading, variant = 'default' }: StatCardProps) {
  if (loading) {
    return (
      <div className="dashboard-card p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl"></div>
          <div className="w-16 h-4 bg-[#1A1A1A] rounded"></div>
        </div>
        <div className="w-24 h-8 bg-[#1A1A1A] rounded mb-2"></div>
        <div className="w-32 h-4 bg-[#1A1A1A] rounded"></div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-[#525252]" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-[#525252]';
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-[#525252]';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'purple':
        return 'bg-[#5C2D91]/10 text-[#7B4FB0]';
      case 'red':
        return 'bg-[#C8102E]/10 text-[#E53935]';
      case 'gold':
        return 'bg-[#D4AF37]/10 text-[#E8C547]';
      case 'green':
        return 'bg-green-500/10 text-green-400';
      default:
        return 'bg-[#1A1A1A] text-[#737373]';
    }
  };

  return (
    <div className="dashboard-card p-6 hover:border-[#333333] transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${getVariantStyles()}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-[#FAFAFA] mb-1">
        {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
      </div>
      <div className="text-sm text-[#737373]">{label}</div>

      {changeLabel && (
        <div className="text-xs text-[#525252] mt-2">{changeLabel}</div>
      )}
    </div>
  );
}
