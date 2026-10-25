import React from 'react';

export type TrendDirection = 'Stable' | 'Rising' | 'Accelerating' | 'Insufficient history';

interface TrendIndicatorProps {
  trend?: TrendDirection | string;
  className?: string;
  showIconOnly?: boolean;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  trend = 'Stable',
  className = '',
  showIconOnly = false,
}) => {
  const normTrend = ((): { label: TrendDirection; symbol: string; colorClass: string } => {
    const t = (trend || '').toLowerCase();
    if (t.includes('accelerat')) {
      return { label: 'Accelerating', symbol: '↑', colorClass: 'text-clay font-bold' };
    }
    if (t.includes('ris') || t.includes('deteriorat') || t.includes('up')) {
      return { label: 'Rising', symbol: '↗', colorClass: 'text-clay font-semibold' };
    }
    if (t.includes('insufficient') || t.includes('single') || t.includes('unknown') || t.includes('none')) {
      return { label: 'Insufficient history', symbol: '—', colorClass: 'text-muted font-normal' };
    }
    return { label: 'Stable', symbol: '→', colorClass: 'text-forest font-medium' };
  })();

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs ${normTrend.colorClass} ${className}`}
      title={`Erosion Trend: ${normTrend.label}`}
    >
      <span className="text-[13px] leading-none select-none">{normTrend.symbol}</span>
      {!showIconOnly && <span className="font-sans text-[11px] tracking-tight">{normTrend.label}</span>}
    </span>
  );
};
