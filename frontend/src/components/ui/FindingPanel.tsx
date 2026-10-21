import React from 'react';
import { SeverityBadge, Severity } from './SeverityBadge';
import { FileCode, GitCommit, AlertTriangle, ChevronRight } from 'lucide-react';

interface FindingPanelProps {
  severity: Severity | string;
  ruleId: string;
  title: string;
  explanation: string;
  observedValue?: string | number;
  threshold?: string | number;
  sourceReference?: string;
  commitHash?: string;
  interfaceName?: string;
  className?: string;
  onExploreHistory?: () => void;
}

export const FindingPanel: React.FC<FindingPanelProps> = ({
  severity,
  ruleId,
  title,
  explanation,
  observedValue,
  threshold,
  sourceReference,
  commitHash,
  interfaceName,
  className = '',
  onExploreHistory,
}) => {
  const isCritical = (severity || '').toLowerCase() === 'critical';
  const isHigh = (severity || '').toLowerCase() === 'high';

  return (
    <article
      className={`bg-paper border border-line p-4 sm:p-5 rounded-sm transition-all hover:border-charcoal/40 ${
        isCritical ? 'border-l-4 border-l-clay pl-4' : isHigh ? 'border-l-2 border-l-clay/70' : ''
      } ${className}`}
    >
      {/* Top Header: Severity + Rule ID + Interface Name */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-line">
        <div className="flex items-center gap-2.5 flex-wrap">
          <SeverityBadge severity={severity} size="sm" />
          <span className="font-mono text-[11px] font-semibold text-charcoal bg-cream px-2 py-0.5 rounded-sm border border-line">
            {ruleId}
          </span>
          {interfaceName && (
            <span className="font-heading font-bold text-xs text-forest tracking-tight">
              {interfaceName}
            </span>
          )}
        </div>

        {commitHash && (
          <span className="font-mono text-[10px] text-muted flex items-center gap-1">
            <GitCommit className="w-3 h-3 text-forest" />
            <span>{commitHash.substring(0, 7)}</span>
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-heading font-bold text-base text-charcoal mb-2 leading-snug">
        {title}
      </h3>

      {/* Evidence-based explanation */}
      <p className="font-sans text-xs sm:text-sm text-charcoal/85 leading-relaxed mb-3">
        {explanation}
      </p>

      {/* Quantitative Evidence Block */}
      {(observedValue !== undefined || threshold !== undefined) && (
        <div className="bg-cream/60 border border-line/70 p-2.5 rounded-sm mb-3 flex flex-wrap items-center gap-4 text-xs font-mono">
          {observedValue !== undefined && (
            <div>
              <span className="text-muted mr-1.5 uppercase tracking-wider text-[10px]">Observed:</span>
              <span className="font-bold text-charcoal">{observedValue}</span>
            </div>
          )}
          {threshold !== undefined && (
            <div className="border-l border-line pl-4">
              <span className="text-muted mr-1.5 uppercase tracking-wider text-[10px]">Rule Threshold:</span>
              <span className="text-charcoal">{threshold}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer: Source File & Action */}
      <div className="flex items-center justify-between pt-2 border-t border-line/50 text-xs">
        {sourceReference ? (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted truncate max-w-[70%]">
            <FileCode className="w-3.5 h-3.5 text-forest shrink-0" />
            <span className="truncate" title={sourceReference}>
              {sourceReference}
            </span>
          </div>
        ) : (
          <span />
        )}

        {onExploreHistory && (
          <button
            type="button"
            onClick={onExploreHistory}
            className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-forest hover:text-clay transition-colors ml-auto"
          >
            <span>Trace History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  );
};
