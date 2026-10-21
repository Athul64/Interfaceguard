import React from 'react';
import { Sparkles, Terminal, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

interface AIExplanationPanelProps {
  summary?: string;
  rootCause?: string;
  impact?: string;
  refactoring?: string[];
  confidenceScore?: number;
  modelUsed?: string;
  className?: string;
  onApplyPlan?: () => void;
}

export const AIExplanationPanel: React.FC<AIExplanationPanelProps> = ({
  summary,
  rootCause,
  impact,
  refactoring,
  confidenceScore = 0.88,
  modelUsed = 'Gemini 1.5 Pro / Arch-Synthesizer',
  className = '',
  onApplyPlan,
}) => {
  return (
    <section
      className={`bg-forest-deep text-cream p-5 sm:p-6 rounded-sm border border-forest/50 shadow-paper relative overflow-hidden ${className}`}
    >
      {/* Background Architectural Watermark */}
      <div className="absolute right-0 top-0 opacity-5 pointer-events-none p-4">
        <Cpu className="w-48 h-48 text-cream" />
      </div>

      {/* Header: Subordinate Flag & Model Provenance */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-forest/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
          <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-amber-soft">
            AI-GENERATED EXPLANATION
          </span>
          <span className="text-[10px] font-mono text-cream/40 hidden sm:inline">|</span>
          <span className="font-mono text-[10px] text-cream/60 hidden sm:inline">
            {modelUsed}
          </span>
        </div>

        <div className="font-mono text-[10px] text-cream/70 bg-forest px-2 py-0.5 rounded-sm border border-forest/40">
          Confidence: {(confidenceScore * 100).toFixed(0)}%
        </div>
      </div>

      {/* Cormorant Garamond Editorial Accent Headline */}
      <h3 className="font-accent italic text-xl sm:text-2xl text-cream font-medium leading-snug mb-3">
        {summary || 'Architectural Interpretation of Measured Interface Deterioration'}
      </h3>

      {/* Explanation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Root Cause */}
        {rootCause && (
          <div className="bg-forest/50 border border-forest/40 p-3.5 rounded-sm">
            <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-amber-soft font-semibold mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber" />
              <span>Root Cause Analysis</span>
            </div>
            <p className="font-sans text-xs text-cream/90 leading-relaxed">
              {rootCause}
            </p>
          </div>
        )}

        {/* Structural Blast Radius / Impact */}
        {impact && (
          <div className="bg-forest/50 border border-forest/40 p-3.5 rounded-sm">
            <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-clay-soft font-semibold mb-1.5">
              <Terminal className="w-3.5 h-3.5 text-clay" />
              <span>Structural Impact</span>
            </div>
            <p className="font-sans text-xs text-cream/90 leading-relaxed">
              {impact}
            </p>
          </div>
        )}
      </div>

      {/* Recommended Concrete Refactorings */}
      {refactoring && refactoring.length > 0 && (
        <div className="mt-4 pt-4 border-t border-forest/40">
          <div className="font-mono text-[11px] uppercase tracking-wider text-cream/70 font-semibold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber" />
            <span>Prescribed Refactoring Strategy</span>
          </div>
          <ul className="space-y-2">
            {refactoring.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs font-sans text-cream/85 bg-forest/30 border border-forest/30 p-2 rounded-sm"
              >
                <span className="font-mono font-bold text-amber-soft text-[11px] mt-0.5 shrink-0">
                  {idx + 1}.
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Subordination Disclaimer */}
      <div className="mt-4 pt-3 border-t border-forest/30 flex items-center justify-between text-[10px] font-mono text-cream/50">
        <span>
          * Subordinate to measured AST metrics & git diff evidence.
        </span>
        {onApplyPlan && (
          <button
            type="button"
            onClick={onApplyPlan}
            className="text-amber-soft hover:text-cream flex items-center gap-1 font-semibold underline underline-offset-2 transition-colors"
          >
            Generate Refactoring Diff <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </section>
  );
};
