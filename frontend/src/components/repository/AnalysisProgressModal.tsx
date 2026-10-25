import React from 'react';
import { 
  Loader2, 
  AlertCircle, 
  XCircle, 
  CheckCircle2, 
  GitBranch, 
  FileCode, 
  Layers, 
  BarChart2, 
  AlertTriangle, 
  GitFork, 
  TrendingDown, 
  Cpu, 
  Database,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cancelAnalysis } from '../../services/api';
import { Button } from '../ui/Button';

// 10-step structured pipeline stages defined in Section 7
const PIPELINE_STAGES = [
  { id: 'acquisition', label: '1. Repository acquisition', icon: GitBranch },
  { id: 'discovery', label: '2. Git-history discovery', icon: GitBranch },
  { id: 'parsing', label: '3. Java parsing', icon: FileCode },
  { id: 'extraction', label: '4. Interface extraction', icon: Layers },
  { id: 'metrics', label: '5. Metric computation', icon: BarChart2 },
  { id: 'smells', label: '6. Design smell detection', icon: AlertTriangle },
  { id: 'dependency', label: '7. Dependency analysis', icon: GitFork },
  { id: 'changepoint', label: '8. Historical trend & change-points', icon: TrendingDown },
  { id: 'explanation', label: '9. AI explanation generation', icon: Cpu },
  { id: 'persistence', label: '10. Results persistence', icon: Database },
];

export const AnalysisProgressModal: React.FC = () => {
  const { activeRunId, activeRunStatus, stopTrackingRun } = useApp();

  if (!activeRunId || !activeRunStatus) return null;

  const handleCancel = async () => {
    try {
      await cancelAnalysis(activeRunId);
      stopTrackingRun();
    } catch (err) {
      console.error('Failed to cancel analysis', err);
    }
  };

  const isCompleted = activeRunStatus.status === 'completed';
  const isFailed = activeRunStatus.status === 'failed';
  const isCancelled = activeRunStatus.status === 'cancelled';
  const isRunning = !isCompleted && !isFailed && !isCancelled;

  // Map progress percent (0 - 100) to current active step in the 10-step sequence
  const currentStepIndex = Math.min(
    9,
    Math.max(
      0,
      isCompleted
        ? 9
        : Math.floor((activeRunStatus.progress_percent / 100) * PIPELINE_STAGES.length)
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-paper border border-line rounded-sm shadow-paper max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-line">
          <div className="flex items-center gap-3">
            {isRunning && (
              <Loader2 className="w-5 h-5 text-forest animate-spin shrink-0" />
            )}
            {isCompleted && <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />}
            {isFailed && <AlertCircle className="w-5 h-5 text-clay shrink-0" />}
            {isCancelled && <XCircle className="w-5 h-5 text-muted shrink-0" />}
            <div>
              <h3 className="font-heading font-bold text-base text-charcoal">
                {isCompleted
                  ? 'Audit Pipeline Completed'
                  : isFailed
                  ? 'Audit Pipeline Failed'
                  : isCancelled
                  ? 'Audit Pipeline Cancelled'
                  : 'Forensic Interface Audit in Progress'}
              </h3>
              <p className="font-mono text-xs text-muted">
                Run #{activeRunStatus.run_id} &bull; Branch: {activeRunStatus.branch || 'main'}
              </p>
            </div>
          </div>
          {(isCompleted || isFailed || isCancelled) && (
            <button
              onClick={stopTrackingRun}
              className="text-xs font-mono text-muted hover:text-charcoal px-2.5 py-1 rounded-sm border border-line"
            >
              Close
            </button>
          )}
        </div>

        {/* Real-time Progress Bar & Stage Label */}
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center text-xs font-sans">
            <span className="font-semibold text-charcoal font-mono">
              Stage: {activeRunStatus.stage || PIPELINE_STAGES[currentStepIndex].label}
            </span>
            <span className="font-mono font-bold text-forest text-sm">
              {Math.round(activeRunStatus.progress_percent)}%
            </span>
          </div>

          <div className="w-full h-2 bg-cream rounded-none overflow-hidden border border-line">
            <div
              className={`h-full transition-all duration-300 ${
                isFailed ? 'bg-clay' : 'bg-forest'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, activeRunStatus.progress_percent))}%` }}
            />
          </div>

          {/* Metric Stats Strip */}
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
            <div className="p-2 rounded-sm bg-cream/60 border border-line text-center">
              <div className="text-[9.5px] uppercase text-muted tracking-wider">Commits</div>
              <div className="font-bold text-charcoal mt-0.5">
                {activeRunStatus.processed_commits} / {activeRunStatus.total_commits || '—'}
              </div>
            </div>
            <div className="p-2 rounded-sm bg-cream/60 border border-line text-center">
              <div className="text-[9.5px] uppercase text-muted tracking-wider">Interfaces</div>
              <div className="font-bold text-charcoal mt-0.5">
                {activeRunStatus.extracted_interfaces}
              </div>
            </div>
            <div className="p-2 rounded-sm bg-cream/60 border border-line text-center">
              <div className="text-[9.5px] uppercase text-muted tracking-wider">Commit SHA</div>
              <div className="font-semibold text-forest mt-0.5 truncate">
                {activeRunStatus.current_commit ? activeRunStatus.current_commit.substring(0, 7) : '—'}
              </div>
            </div>
          </div>

          {/* Structured 10-Stage Pipeline Sequence View */}
          <div className="mt-4 pt-3 border-t border-line">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block mb-2">
              Pipeline Execution Sequence
            </span>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {PIPELINE_STAGES.map((step, idx) => {
                const isStepCompleted = isCompleted || idx < currentStepIndex;
                const isStepActive = isRunning && idx === currentStepIndex;
                const isStepPending = !isCompleted && idx > currentStepIndex;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm border text-xs font-mono transition-colors ${
                      isStepCompleted
                        ? 'bg-forest-soft/60 border-forest/30 text-forest'
                        : isStepActive
                        ? 'bg-paper border-charcoal text-charcoal font-bold shadow-xs'
                        : 'bg-cream/30 border-line/60 text-muted/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isStepCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0" />
                      ) : isStepActive ? (
                        <Loader2 className="w-3.5 h-3.5 text-forest animate-spin shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-line flex items-center justify-center text-[8px] text-muted shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate">{step.label}</span>
                    </div>

                    <span className="text-[10px] shrink-0 font-medium">
                      {isStepCompleted ? (
                        <span className="text-forest">Done</span>
                      ) : isStepActive ? (
                        <span className="text-forest font-bold">Running</span>
                      ) : (
                        <span>Pending</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message if any */}
          {activeRunStatus.error_message && (
            <div className="p-3 rounded-sm bg-clay-soft border-l-4 border-l-clay text-xs text-clay font-sans mt-3">
              <b>Warning / Error:</b> {activeRunStatus.error_message}
            </div>
          )}

          {/* Cancel Action */}
          {isRunning && (
            <div className="pt-3 flex justify-end">
              <Button
                variant="clay"
                size="sm"
                onClick={handleCancel}
              >
                Cancel Analysis
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
