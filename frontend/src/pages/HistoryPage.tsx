import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { btn, EmptyState, PageHeader, SectionTitle, Shell } from "@/components/ig";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { fetchHistory, fetchChangePoints } from "@/services/api";

export default function HistoryPage() {
  const { currentRun, activeRunId, repositories, currentRepo } = useApp();
  const [metric, setMetric] = useState<"health" | "index">("health");
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [changePointsList, setChangePointsList] = useState<any[]>([]);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const targetRunId = currentRun?.run_id || activeRunId || repositories[0]?.latest_run?.run_id;

  useEffect(() => {
    if (!targetRunId) {
      setLoading(false);
      setHistoryList([]);
      setChangePointsList([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchHistory(targetRunId).catch(() => []),
      fetchChangePoints(targetRunId).catch(() => []),
    ])
      .then(([histRes, cpRes]) => {
        if (!isMounted) return;

        const cpSet = new Set((cpRes || []).map((cp: any) => cp.commit_hash?.slice(0, 7)));

        const mapped = (histRes || []).map((h: any) => {
          const short = h.short_hash || h.commit_hash?.slice(0, 7) || "commit";
          const rawScore = h.project_erosion_index ?? 100;
          return {
            commit: short,
            fullHash: h.commit_hash,
            date: h.commit_date?.slice(0, 10) || "Unknown",
            author: h.author || "author",
            health: Math.round(rawScore),
            index: Number((rawScore > 1 ? (100 - rawScore) / 100 : rawScore).toFixed(2)),
            cp: cpSet.has(short),
          };
        });

        setHistoryList(mapped);
        setChangePointsList(cpRes || []);
        if (mapped.length > 0) {
          // Select change point if available, else first commit
          const firstCp = mapped.find((m: any) => m.cp);
          setSelectedHash((firstCp || mapped[0]).commit);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load history:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetRunId]);

  const repoName = currentRepo?.name || "Repository";
  const branchName = currentRepo?.default_branch || "main";
  const sel = historyList.find((h) => h.commit === selectedHash) || historyList[0];
  const activeCp = changePointsList.find((cp) => cp.commit_hash?.slice(0, 7) === selectedHash);

  return (
    <Shell crumbs={["History"]}>
      <PageHeader
        eyebrow={`${repoName} · ${branchName} · ${historyList.length} analyzed commits`}
        title="History"
        accent="and the moment it turned."
        actions={
          <div className="flex gap-1 font-mono text-xs">
            {(["health", "index"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  "rounded-sm border px-2.5 py-1.5 cursor-pointer",
                  metric === m ? "border-forest bg-forest text-cream" : "border-border bg-paper"
                )}
              >
                {m === "health" ? "Health Score" : "Erosion Index"}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="flex h-96 items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-forest" />
          <p className="font-mono text-xs text-muted-foreground">Loading commit timeline...</p>
        </div>
      ) : historyList.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={!targetRunId ? "No repository analyzed." : "No commit history found."}
            desc={
              !targetRunId
                ? "Please intake and analyze a repository to inspect its commit timeline and change points."
                : "No commit snapshots were recorded for this analysis run."
            }
          />
          {!targetRunId && (
            <div className="mt-4 text-center">
              <Link to="/" className={btn({ size: "sm" })}>
                Go to Intake
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-8 h-72">
            <ResponsiveContainer>
              <LineChart
                data={historyList}
                margin={{ left: -16, right: 8, top: 16 }}
                onClick={(e) => e?.activeLabel && setSelectedHash(String(e.activeLabel))}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="commit" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} stroke="var(--charcoal)" />
                <YAxis domain={metric === "health" ? [0, 100] : [0, 1]} tick={{ fontSize: 10 }} stroke="var(--charcoal)" />
                <Tooltip contentStyle={{ background: "var(--paper)", border: "1px solid var(--border)", fontFamily: "IBM Plex Mono", fontSize: 12 }} />
                {historyList.filter((h) => h.cp).map((h) => (
                  <ReferenceLine
                    key={h.commit}
                    x={h.commit}
                    stroke="var(--clay)"
                    strokeDasharray="4 3"
                    label={{ value: "◆", fill: "var(--clay)", position: "top" }}
                  />
                ))}
                {sel && <ReferenceLine x={sel.commit} stroke="var(--charcoal)" strokeOpacity={0.5} />}
                <Line dataKey={metric} stroke="var(--forest)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ol className="mt-4 flex gap-0 overflow-x-auto border-y border-border font-mono text-[11px]">
            {historyList.map((h) => (
              <li key={h.commit}>
                <button
                  onClick={() => setSelectedHash(h.commit)}
                  className={cn(
                    "min-w-24 border-r border-border px-3 py-2 text-left cursor-pointer",
                    selectedHash === h.commit && "bg-forest text-cream"
                  )}
                >
                  <span className={cn(h.cp && selectedHash !== h.commit && "text-clay font-bold")}>
                    {h.cp ? "◆ " : "· "}{h.commit}
                  </span>
                  <br />
                  <span className="opacity-60">{h.date}</span>
                </button>
              </li>
            ))}
          </ol>

          {sel && (
            <section className="mt-10 grid gap-10 lg:grid-cols-2">
              <div>
                <SectionTitle n="01" title={`Commit ${sel.commit}`} />
                {activeCp ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-mono text-xs text-muted-foreground">{activeCp.commit_date} · @{activeCp.author}</p>
                    <p className="font-medium">{activeCp.description || activeCp.message}</p>
                    <p className="font-mono text-clay">
                      Detected change point · Health {Math.round(activeCp.score_before || 0)} → {Math.round(activeCp.score_after || 0)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-mono text-xs text-charcoal">{sel.date} · @{sel.author}</p>
                    <p>Health Score {sel.health} &bull; Erosion Index {sel.index}</p>
                    <p className="text-xs">{sel.cp ? "Change point detected at this commit." : "Normal architectural stability observed."}</p>
                  </div>
                )}
              </div>

              <div>
                <SectionTitle n="02" title="Commit details" />
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="eyebrow text-left">
                      <th className="font-normal py-1">Attribute</th>
                      <th className="font-normal py-1">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-2 text-muted-foreground">Full Hash</td>
                      <td className="truncate max-w-[200px]" title={sel.fullHash}>{sel.fullHash || sel.commit}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-2 text-muted-foreground">Date</td>
                      <td>{sel.date}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-2 text-muted-foreground">Author</td>
                      <td>{sel.author}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-2 text-muted-foreground">Health Score</td>
                      <td className={cn(sel.health < 50 ? "text-clay" : "text-forest")}>{sel.health} / 100</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </Shell>
  );
}
