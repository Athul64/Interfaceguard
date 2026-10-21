import React from 'react';
import { HelpCircle } from 'lucide-react';

interface MetricDisplayProps {
  id: string; // e.g. "CBO", "LCOM", "RFC", "WMC", "DIT", "NOC", "Churn"
  name?: string; // full name e.g. "Coupling Between Objects"
  value: number | string | null | undefined;
  delta?: number | null; // change from prior snapshot
  threshold?: string | number;
  description?: string;
  isAvailable?: boolean;
  unit?: string;
  className?: string;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  id,
  name,
  value,
  delta,
  threshold,
  description,
  isAvailable = true,
  unit = '',
  className = '',
}) => {
  const formattedVal =
    !isAvailable || value === null || value === undefined
      ? '—'
      : typeof value === 'number'
      ? Number.isInteger(value)
        ? value.toString()
        : value.toFixed(2)
      : value;

  const deltaFormatted =
    delta !== undefined && delta !== null && delta !== 0
      ? delta > 0
        ? `+${typeof delta === 'number' && !Number.isInteger(delta) ? delta.toFixed(1) : delta}`
        : `${typeof delta === 'number' && !Number.isInteger(delta) ? delta.toFixed(1) : delta}`
      : null;

  const isDeteriorating = delta !== undefined && delta !== null && delta > 0;
  const isImproving = delta !== undefined && delta !== null && delta < 0;

  return (
    <div
      className={`bg-paper border border-line p-3 sm:p-4 rounded-sm transition-all hover:border-charcoal/30 relative group ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs font-semibold text-forest tracking-wider uppercase">
          {id}
        </span>
        {description && (
          <div className="relative">
            <span
              className="text-muted/60 hover:text-charcoal cursor-help transition-colors"
              title={description}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
            {/* Tooltip trigger */}
            <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 bg-charcoal text-cream text-[11px] font-sans rounded-sm shadow-paper z-30 pointer-events-none">
              <div className="font-semibold mb-0.5">{name || id}</div>
              <div className="text-line">{description}</div>
              {threshold !== undefined && (
                <div className="mt-1 pt-1 border-t border-line/30 text-[10px] text-amber-soft">
                  Threshold: {threshold}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="font-heading font-bold text-2xl sm:text-3xl text-charcoal tracking-tight">
          {formattedVal}
          {unit && <span className="text-xs font-mono font-normal text-muted ml-1">{unit}</span>}
        </div>

        {deltaFormatted && (
          <span
            className={`font-mono text-xs px-1.5 py-0.5 rounded-sm ${
              isDeteriorating
                ? 'bg-clay-soft text-clay font-semibold'
                : isImproving
                ? 'bg-forest-soft text-forest'
                : 'text-muted'
            }`}
          >
            {deltaFormatted}
          </span>
        )}
      </div>

      {name && (
        <div className="text-[11px] font-sans text-muted mt-1 truncate" title={name}>
          {name}
        </div>
      )}
    </div>
  );
};
