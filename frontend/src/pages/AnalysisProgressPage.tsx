import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Check, Circle, Loader2, X } from "lucide-react";
import { btn } from "@/components/ig";
import { stages } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useApp } from "../context/AppContext";
import { cancelAnalysis, fetchAnalysisStatus } from "../services/api";
import { AnalysisRun } from "../types";

export const AnalysisProgressPage: React.FC = () => {
  const {
    activeRunId,
    activeRunStatus,
    currentRun,
    currentRepo,
    selectRun,
    stopTrackingRun,
  } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryRunId = searchParams.get("run_id") ? parseInt(searchParams.get("run_id")!, 10) : null;
  const targetRunId = activeRunId || queryRunId || currentRun?.run_id;

  const [runStatus, setRunStatus] = useState<AnalysisRun | null>(activeRunStatus || currentRun || null);
  const [cancelled, setCancelled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Poll backend run status
  useEffect(() => {
    if (!targetRunId) return;

    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await fetchAnalysisStatus(targetRunId);
        if (isMounted && res) {
          setRunStatus(res);
          if (res.status === "completed") {
            selectRun(res);
          } else if (res.status === "failed") {
            setErrorMsg(res.error_message || "Analysis failed unexpectedly.");
          } else if (res.status === "cancelled") {
            setCancelled(true);
          }
        }
      } catch (err: any) {
        console.error("Polling error on analysis page:", err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [targetRunId, selectRun]);

  const isCompleted = runStatus?.status === "completed";
  const isFailed = runStatus?.status === "failed" || !!errorMsg;

  // Auto-redirect to overview ONLY when the backend actually completes the analysis
  useEffect(() => {
    if (!isCompleted) return;
    const timer = setTimeout(() => {
      navigate("/overview");
    }, 1500);
    return () => clearTimeout(timer);
  }, [isCompleted, navigate]);

  const handleCancel = async () => {
    setCancelled(true);
    if (targetRunId) {
      try {
        await cancelAnalysis(targetRunId);
        stopTrackingRun();
      } catch (err) {
        console.error("Failed to cancel analysis:", err);
      }
    }
  };

  const progressPercent = runStatus?.progress_percent ?? 0;
  // Calculate current stage index 0..9
  const currentStep = isCompleted
    ? stages.length
    : isFailed
    ? 2
    : Math.min(stages.length - 1, Math.floor((progressPercent / 100) * stages.length));

  const runIdDisplay = runStatus?.run_id || targetRunId ? `#${runStatus?.run_id || targetRunId}` : "Active";
  const displayRepo = currentRepo?.name || "Repository";
  const displayBranch = runStatus?.branch || currentRepo?.default_branch || "main";
  const processedCommits = runStatus?.processed_commits ?? 0;
  const totalCommits = runStatus?.total_commits ?? "—";
  const interfaceCount = runStatus?.extracted_interfaces ?? (runStatus?.status === "running" ? "Scanning..." : 0);
  const currentCommit = runStatus?.current_commit ? runStatus.current_commit.slice(0, 7) : "—";
  const currentStageText = runStatus?.stage || "Acquiring repository and analyzing history...";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-20 min-h-screen">
      <p className="eyebrow">
        Run {runIdDisplay} · {displayRepo} · {displayBranch}
      </p>

      <div className="flex flex-wrap items-baseline justify-between gap-4 mt-3">
        <h1 className="text-3xl font-bold md:text-4xl text-charcoal">
          {cancelled
            ? "Analysis cancelled."
            : isFailed
            ? "Analysis failed."
            : isCompleted
            ? "Analysis complete."
            : "Analyzing architecture"}
          {!isCompleted && !cancelled && !isFailed && (
            <span className="accent-serif font-normal text-clay"> of {displayRepo}.</span>
          )}
        </h1>

        {isCompleted && (
          <span className="font-mono text-xs text-forest flex items-center gap-2 font-semibold">
            <span className="size-2 rounded-full bg-forest animate-pulse" />
            Redirecting to overview...
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-muted-foreground font-mono">
        {currentStageText}
      </p>

      {errorMsg && (
        <div className="mt-4 border border-clay/40 bg-clay/10 p-4 rounded-sm text-sm text-clay flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 border-y border-border py-4 font-mono text-sm">
        <div>
          <p className="eyebrow">Commits processed</p>
          <p className="mt-1 text-xl">
            {processedCommits}
            <span className="text-muted-foreground"> / {totalCommits}</span>
          </p>
        </div>
        <div>
          <p className="eyebrow">Interfaces discovered</p>
          <p className="mt-1 text-xl">{interfaceCount}</p>
        </div>
        <div>
          <p className="eyebrow">Active commit</p>
          <p className="mt-1 text-xl">{currentCommit}</p>
        </div>
      </div>

      <ol className="mt-8">
        {stages.map((s, i) => {
          const isDone = isCompleted || i < currentStep;
          const isRunning = !isCompleted && !isFailed && !cancelled && i === currentStep;
          const isCancelled = cancelled && i >= currentStep;

          return (
            <li key={s} className="flex items-center gap-4 border-b border-border py-3">
              <span className="w-6 font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border",
                  isDone && "border-forest bg-forest text-cream",
                  isRunning && "border-forest",
                  isCancelled && "border-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="size-3" />
                ) : isRunning ? (
                  <Loader2 className="size-3 animate-spin text-forest" />
                ) : isCancelled ? (
                  <X className="size-3 text-muted-foreground" />
                ) : (
                  <Circle className="size-2 text-muted-foreground" />
                )}
              </span>
              <span
                className={cn(
                  "flex-1 text-sm font-medium",
                  !isDone && !isRunning ? "text-muted-foreground" : "text-charcoal"
                )}
              >
                {s}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {isDone ? "done" : isRunning ? "running" : isCancelled ? "cancelled" : "queued"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex gap-3">
        {isCompleted ? (
          <Link to="/overview" className={btn()}>
            Open overview
          </Link>
        ) : cancelled || isFailed ? (
          <Link to="/" className={btn({ variant: "outline" })}>
            Back to intake
          </Link>
        ) : (
          <button onClick={handleCancel} className={btn({ variant: "outline" })}>
            Cancel analysis
          </button>
        )}
      </div>
    </div>
  );
};

export default AnalysisProgressPage;
