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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-600';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg text-purple-600">
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      
      {changeLabel && (
        <div className="text-xs text-gray-400 mt-2">{changeLabel}</div>
      )}
    </div>
  );
}
