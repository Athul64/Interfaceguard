import React from 'react';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  className = '',
}) => {
  const normSeverity = (severity || 'Low') as Severity;

  // Format styles strictly based on the Field Journal color tokens
  const styleConfig: Record<Severity, { container: string; dot: string; label: string }> = {
    Critical: {
      container: 'bg-clay-soft text-clay border border-clay/40 font-semibold',
      dot: 'bg-clay shadow-[0_0_0_2px_rgba(204,88,51,0.2)]',
      label: 'Critical',
    },
    High: {
      container: 'bg-transparent text-clay border border-clay/60 font-semibold',
      dot: 'bg-clay',
      label: 'High',
    },
    Medium: {
      container: 'bg-amber-soft text-amber border border-amber/40 font-medium',
      dot: 'bg-amber',
      label: 'Medium',
    },
    Low: {
      container: 'bg-forest-soft text-forest border border-forest/30 font-medium',
      dot: 'bg-forest',
      label: 'Low',
    },
  };

  const config = styleConfig[normSeverity] || styleConfig['Low'];

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-2';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center rounded-sm font-sans tracking-tight transition-colors ${sizeClass} ${config.container} ${className}`}
      aria-label={`Severity: ${config.label}`}
    >
      <span className={`${dotSize} rounded-full shrink-0 ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
