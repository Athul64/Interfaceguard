import { useState } from "react";
import { AlertTriangle, Check, Download, FileText, Loader2, RotateCw } from "lucide-react";
import { btn, PageHeader, SectionTitle, Shell } from "@/components/ig";
import { repo } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useApp } from "../context/AppContext";

const scopes = [
  "Full analysis",
  "Selected interfaces",
  "Selected findings",
  "Historical analysis",
  "Evaluation results",
];

export default function ReportsPage() {
  const { currentRun, activeRunId, repositories, currentRepo } = useApp();
  const [scope, setScope] = useState(scopes[0]);
  const [state, setState] = useState<"idle" | "gen" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectiveRunId = currentRun?.run_id || activeRunId || repositories[0]?.latest_run?.run_id;
  const repoName = currentRepo?.name || repo.name;

  const triggerDownload = async (runId?: number) => {
    setState("gen");
    setErrorMsg(null);
    try {
      const targetId = runId || effectiveRunId;
      const url = targetId ? `/api/v1/reports/pdf?run_id=${targetId}` : `/api/v1/reports/pdf`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.error || `Server returned HTTP ${res.status}`);
      }
      
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `InterfaceGuard_Report_${targetId ? `Run_${targetId}` : "Latest"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      setState("done");
    } catch (err: any) {
      console.error("PDF generation/download error:", err);
      // Fallback: direct window open
      const fallbackUrl = (runId || effectiveRunId)
        ? `/api/v1/reports/pdf?run_id=${runId || effectiveRunId}`
        : `/api/v1/reports/pdf`;
      window.open(fallbackUrl, "_blank");
      setState("done");
    }
  };

  return (
    <Shell crumbs={["Reports"]}>
      <PageHeader eyebrow="PDF only" title="Reports" />
      <section className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionTitle n="01" title="Report scope" />
          <div className="space-y-1">
            {scopes.map((s) => (
              <label
                key={s}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border px-3 py-2.5 text-sm transition-colors",
                  scope === s ? "border-forest bg-accent" : "border-border hover:bg-secondary/40"
                )}
              >
                <input
                  type="radio"
                  checked={scope === s}
                  onChange={() => setScope(s)}
                  className="accent-[var(--forest)]"
                />
                {s}
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={() => triggerDownload(effectiveRunId)}
              disabled={state === "gen"}
              className={cn(btn(), "w-full sm:w-auto cursor-pointer")}
            >
              {state === "gen" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating PDF…
                </>
              ) : state === "done" ? (
                <>
                  <Check className="size-4 text-healthy" />
                  Downloaded — generate again
                </>
              ) : (
                <>
                  <FileText className="size-4" />
                  Generate PDF
                </>
              )}
            </button>
            {state === "done" && (
              <span className="font-mono text-xs text-forest flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-forest" />
                Report downloaded
              </span>
            )}
            {errorMsg && (
              <span className="font-mono text-xs text-clay flex items-center gap-1.5">
                <AlertTriangle className="size-3" />
                {errorMsg}
              </span>
            )}
          </div>
        </div>

        <div>
          <SectionTitle n="02" title="Preview" />
          <div className="aspect-[1/1.3] max-w-sm border border-border bg-paper p-6 shadow-sm">
            <p className="eyebrow">InterfaceGuard report</p>
            <p className="mt-2 font-display text-xl font-bold">{repoName}</p>
            <p className="accent-serif text-lg text-clay">{scope}</p>
            <ol className="mt-6 space-y-2 border-t border-border pt-4 font-mono text-xs">
              <li>1. Erosion Index summary</li>
              <li>2. Most eroded interfaces</li>
              <li>3. Evidence & findings</li>
              <li>4. Change points</li>
              <li>5. AI explanations (marked)</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle n="03" title="Generated reports" />
        {!effectiveRunId ? (
          <p className="py-6 font-mono text-xs text-muted-foreground italic border-b border-border">
            No reports generated yet. Intake and analyze a repository to generate PDF audit reports.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 font-mono">{repoName}</td>
                <td className="font-mono">Run #{effectiveRunId}</td>
                <td className="font-mono text-xs text-muted-foreground">
                  {currentRun?.completed_at ? new Date(currentRun.completed_at).toLocaleString() : "Latest"}
                </td>
                <td>
                  <span className="font-mono text-xs text-forest">● Ready</span>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => triggerDownload(effectiveRunId)}
                    className={cn(btn({ variant: "outline", size: "sm" }), "cursor-pointer")}
                  >
                    <Download className="size-3" />PDF
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </Shell>
  );
}
