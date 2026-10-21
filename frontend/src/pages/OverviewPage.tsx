import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { btn, EmptyState, PageHeader, SectionTitle, Shell, SeverityBadge, TrendTag } from "@/components/ig";
import { Severity, Trend, normalizeSeverity, normalizeTrend } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import { fetchAnalysisSummary } from "@/services/api";
import { SummaryData } from "@/types";

const C = { forest: "var(--forest)", clay: "var(--clay)", axis: "var(--charcoal)" };

export default function OverviewPage() {
  const { currentRun, currentRepo, activeRunId, repositories } = useApp();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const targetRunId = currentRun?.run_id || activeRunId || repositories[0]?.latest_run?.run_id;

  useEffect(() => {
    if (!targetRunId) {
      setLoading(false);
      setSummary(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    fetchAnalysisSummary(targetRunId)
      .then((data) => {
        if (isMounted) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch summary:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetRunId]);

  if (loading) {
    return (
      <Shell crumbs={["Overview"]}>
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-forest" />
          <p className="font-mono text-xs text-muted-foreground">Loading analysis metrics...</p>
        </div>
      </Shell>
    );
  }

  if (!summary || !targetRunId) {
    return (
      <Shell crumbs={["Overview"]}>
        <div className="py-20 text-center">
          <EmptyState
            title="No repository analyzed yet."
            desc="Please intake and analyze a repository to view project erosion metrics, interface health, and change points."
          />
          <div className="mt-6">
            <Link to="/" className={btn()}>
              Go to Intake
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const repoName = summary.repository?.name || currentRepo?.name || "Repository";
  const commit = currentRun?.current_commit ? currentRun.current_commit.slice(0, 7) : (summary.repository?.default_branch || "main");
  const erosionIndexRaw = summary.project_erosion_index ?? 0;
  // Normalized 0 to 1 for index display
  const erosionIndexNorm = erosionIndexRaw > 1 ? erosionIndexRaw / 100 : erosionIndexRaw;

  // Format worst interfaces
  const worst = (summary.most_eroded_interfaces || []).slice(0, 5).map((i) => {
    const sev = normalizeSeverity(i.severity, i.health_score);
    const tr = normalizeTrend(i.trend);
    return {
      id: String(i.interface_id || i.name),
      name: i.name,
      pkg: i.package,
      health: Math.round(i.health_score),
      severity: sev,
      trend: tr,
    };
  });

  const rising = (summary.most_eroded_interfaces || [])
    .filter((i) => i.trend?.toLowerCase() === "accelerating" || i.trend?.toLowerCase() === "rising")
    .map((i) => ({
      id: String(i.interface_id || i.name),
      name: i.name,
      trend: normalizeTrend(i.trend),
    }));

  // History data
  const historyData = (summary.history_trend || []).map((h) => ({
    date: h.commit_date?.slice(0, 10) || "Recent",
    commit: h.commit_hash?.slice(0, 7) || "",
    index: Number(((h.project_erosion_index || 0) > 1 ? (h.project_erosion_index || 0) / 100 : h.project_erosion_index || 0).toFixed(2)),
    health: Math.round(100 - (h.project_erosion_index || 0)),
    cp: false,
  }));

  // If only 1 commit, add fallback point for line visibility
  if (historyData.length === 1) {
    historyData.unshift({
      date: "Initial",
      commit: "base",
      index: Math.max(0, Number((historyData[0].index - 0.05).toFixed(2))),
      health: Math.min(100, historyData[0].health + 5),
      cp: false,
    });
  }

  // Severity counts
  const sevDist = summary.health_distribution || { healthy: 0, warning: 0, high: 0, critical: 0 };
  const sevList: [Severity, number][] = [
    ["Low", sevDist.healthy || 0],
    ["Medium", sevDist.warning || 0],
    ["High", sevDist.high || 0],
    ["Critical", sevDist.critical || 0],
  ];
  const maxSev = Math.max(1, ...sevList.map(([, n]) => n));

  // Health Score distribution buckets (0-20, 20-40, 40-60, 60-80, 80-100)
  const allInterfaces = summary.most_eroded_interfaces || [];
  const dist = [
    { b: "0–20", n: allInterfaces.filter((x) => x.health_score < 20).length },
    { b: "20–40", n: allInterfaces.filter((x) => x.health_score >= 20 && x.health_score < 40).length },
    { b: "40–60", n: allInterfaces.filter((x) => x.health_score >= 40 && x.health_score < 60).length },
    { b: "60–80", n: allInterfaces.filter((x) => x.health_score >= 60 && x.health_score < 80).length },
    { b: "80–100", n: allInterfaces.filter((x) => x.health_score >= 80).length },
  ];

  const ispCount = summary.findings_by_category?.isp_violation || 0;
  const smellCount = summary.findings_by_category?.code_smell || 0;
  const cyclesCount = summary.cycles_count || 0;
  const changePointsCount = summary.change_points_count || 0;

  return (
    <Shell crumbs={["Overview"]}>
      <PageHeader
        eyebrow={`Latest commit ${commit} · ${repoName}`}
        title="Project overview"
        actions={
          <>
            <Link to="/analysis" className={btn({ variant: "outline", size: "sm" })}>
              <RefreshCw className="size-3.5" />Re-analyze
            </Link>
            <Link to="/reports" className={btn({ size: "sm" })}>
              <Download className="size-3.5" />Export PDF
            </Link>
          </>
        }
      />

      <section className="grid gap-10 py-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="eyebrow">Project Erosion Index</p>
          <p className="mt-2 font-display text-7xl font-extrabold tracking-tight">
            {erosionIndexNorm.toFixed(2)}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <SeverityBadge s={erosionIndexNorm > 0.6 ? "Critical" : erosionIndexNorm > 0.4 ? "High" : erosionIndexNorm > 0.2 ? "Medium" : "Low"} />
            <span className="font-mono text-sm text-muted-foreground">
              {summary.total_interfaces} interfaces discovered
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Repository-wide aggregate (0 = sound, 1 = eroded). Distinct from per-interface Health Scores (0–100, higher is healthier).
          </p>
          <p className="accent-serif mt-6 text-2xl text-forest">
            {erosionIndexNorm > 0.5 ? "Interface erosion requires architectural attention." : "System interfaces exhibit sound cohesion."}
          </p>
        </div>

        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={historyData} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} stroke={C.axis} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} stroke={C.axis} />
              <Tooltip contentStyle={{ background: "var(--paper)", border: "1px solid var(--border)", fontFamily: "IBM Plex Mono", fontSize: 12 }} />
              <Line type="monotone" dataKey="index" name="Erosion Index" stroke={C.forest} strokeWidth={2} dot={{ r: 3 }} />
              {historyData.filter((h) => h.cp).map((h) => (
                <ReferenceDot key={h.commit} x={h.date} y={h.index} r={5} fill={C.clay} stroke="var(--paper)" />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="font-mono text-[11px] text-muted-foreground mt-2">
            Analyzed {summary.processed_commits} commit{summary.processed_commits === 1 ? "" : "s"} &bull; Git commit history trend
          </p>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <SectionTitle n="01" title="Most eroded interfaces" link={{ to: "/interfaces", label: `All ${summary.total_interfaces}` }} />
          {worst.length === 0 ? (
            <p className="py-6 font-mono text-xs text-muted-foreground italic">No eroded interfaces detected.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {worst.map((i) => (
                  <tr key={i.id} className="border-b border-border hover:bg-secondary/60">
                    <td className="py-2.5">
                      <Link to={`/interfaces/${i.id}`} className="font-mono font-medium hover:underline">
                        {i.name}
                      </Link>
                      <div className="font-mono text-[11px] text-muted-foreground">{i.pkg}</div>
                    </td>
                    <td className="font-mono">{i.health}</td>
                    <td><SeverityBadge s={i.severity} /></td>
                    <td className="hidden sm:table-cell"><TrendTag t={i.trend} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-10">
          <div>
            <SectionTitle n="02" title="Severity distribution" />
            {sevList.map(([s, n]) => (
              <div key={s} className="mb-2 flex items-center gap-3 text-sm">
                <span className="w-20"><SeverityBadge s={s} /></span>
                <div className="h-2 flex-1 bg-muted">
                  <div
                    className={s === "Low" ? "h-full bg-forest" : s === "Medium" ? "h-full bg-amber" : "h-full bg-clay"}
                    style={{ width: `${(n / maxSev) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono">{n}</span>
              </div>
            ))}
          </div>

          <div>
            <SectionTitle n="03" title="Health Score distribution" />
            <div className="h-36">
              <ResponsiveContainer>
                <BarChart data={dist} margin={{ left: -28 }}>
                  <XAxis dataKey="b" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} stroke={C.axis} />
                  <YAxis tick={{ fontSize: 10 }} stroke={C.axis} />
                  <Bar dataKey="n" fill={C.forest} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-10 md:grid-cols-3">
        <div>
          <SectionTitle n="04" title="Rising erosion" />
          {rising.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground italic">No interfaces currently accelerating.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {rising.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <Link to={`/interfaces/${i.id}`} className="font-mono hover:underline">{i.name}</Link>
                  <TrendTag t={i.trend} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <SectionTitle n="05" title="Statistical change points" link={{ to: "/history", label: "Timeline" }} />
          <p className="font-mono text-xs text-muted-foreground">
            {changePointsCount > 0
              ? `${changePointsCount} change point(s) detected via CUSUM / PELT.`
              : "No abrupt change points detected in the analyzed commit window."}
          </p>
        </div>

        <div>
          <SectionTitle n="06" title="Cycles & smells" link={{ to: "/dependencies", label: "Graph" }} />
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt>Dependency cycles</dt>
            <dd className={btn({ size: "sm" }) ? (cyclesCount > 0 ? "text-right font-mono text-clay" : "text-right font-mono") : "text-right font-mono"}>
              {cyclesCount}
            </dd>
            <dt>ISP violations</dt><dd className="text-right font-mono">{ispCount}</dd>
            <dt>Code smells</dt><dd className="text-right font-mono">{smellCount}</dd>
            <dt>Total interfaces</dt><dd className="text-right font-mono">{summary.total_interfaces}</dd>
          </dl>
        </div>
      </section>
    </Shell>
  );
}
