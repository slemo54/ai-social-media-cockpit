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
      <div className="bg-white rounded-xl p-6 border border-[#E8E0D8] shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-[#F5EFE7] rounded-lg"></div>
          <div className="w-16 h-4 bg-[#F5EFE7] rounded"></div>
        </div>
        <div className="w-24 h-8 bg-[#F5EFE7] rounded mb-2"></div>
        <div className="w-32 h-4 bg-[#F5EFE7] rounded"></div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-[#9B8E82]" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-[#9B8E82]';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-500';
    return 'text-[#9B8E82]';
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-[#E8E0D8] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-[#C8956C]/10 rounded-lg text-[#C8956C]">
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-[#2D2D2D] mb-1">
        {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
      </div>
      <div className="text-sm text-[#9B8E82]">{label}</div>

      {changeLabel && (
        <div className="text-xs text-[#C4B8AD] mt-2">{changeLabel}</div>
      )}
    </div>
  );
}
