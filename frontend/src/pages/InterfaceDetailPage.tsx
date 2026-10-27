import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FilePlus2, GitCompare, Sparkles, Loader2, AlertTriangle, CheckCircle2, Layers, ShieldAlert } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { btn, EmptyState, PageHeader, SectionTitle, Shell, SeverityBadge, Tip, TrendTag } from "@/components/ig";
import { Severity, Trend, normalizeSeverity, normalizeTrend } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { fetchInterfaceDetail, fetchInterfaceHistory, requestInterfaceExplanation } from "@/services/api";

function parseSteps(text?: string): string[] {
  if (!text) return [];
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines.map((l) => l.replace(/^[-*•\d.]+\s*/, ''));
  }
  const parts = text.split(/(?:\s|^)\d+\.\s+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  return [text];
}

function parseBreakdown(text?: string): { name: string; methods: string[] }[] {
  if (!text) return [];
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const items: { name: string; methods: string[] }[] = [];
  for (const line of lines) {
    const clean = line.replace(/^[-*•]\s*/, '');
    const colonIdx = clean.indexOf(':');
    if (colonIdx > 0) {
      const name = clean.slice(0, colonIdx).trim();
      const rawMethods = clean
        .slice(colonIdx + 1)
        .split(',')
        .map((m) => m.trim().replace(/[\[\]]/g, ''))
        .filter(Boolean);
      items.push({ name, methods: rawMethods });
    } else {
      items.push({ name: clean, methods: [] });
    }
  }
  return items;
}

function parseRisks(text?: string): { risk: string; mitigation?: string } {
  if (!text) return { risk: "" };
  const match = text.match(/(?:mitigation(?:s|\s+strategies|\s+strategy)?:?)\s*(.*)/i);
  if (match) {
    return {
      risk: text.slice(0, match.index).trim(),
      mitigation: match[1].trim(),
    };
  }
  return { risk: text };
}

export default function InterfaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentRun, activeRunId, repositories, currentRepo } = useApp();
  const [data, setData] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCp, setShowCp] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  const targetRunId = currentRun?.run_id || activeRunId || repositories[0]?.latest_run?.run_id;

  const handleGenerateAi = async () => {
    if (!targetRunId || !id) return;
    setGeneratingAi(true);
    setQuotaNotice(null);
    try {
      const res = await requestInterfaceExplanation(targetRunId, id);
      if (res) {
        setData((prev: any) => ({ ...prev, explanation: res }));
        if (res.quota_exceeded) {
          setQuotaNotice(res.quota_notice || "Gemini daily quota limit reached (20 requests/day or 5 RPM). Preserving deterministic analysis.");
        }
      }
    } catch (err: any) {
      console.error("AI explanation error:", err);
      setQuotaNotice("Gemini quota or network limit reached. Preserving deterministic analysis.");
    } finally {
      setGeneratingAi(false);
    }
  };

  useEffect(() => {
    if (!targetRunId || !id) {
      setLoading(false);
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchInterfaceDetail(targetRunId, id),
      fetchInterfaceHistory(targetRunId, id).catch(() => []),
    ])
      .then(([detailRes, histRes]) => {
        if (isMounted) {
          setData(detailRes);
          setHistoryData(histRes || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load interface detail:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetRunId, id]);

  if (loading) {
    return (
      <Shell crumbs={["Interfaces", "Loading..."]}>
        <div className="flex h-96 items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-forest" />
          <p className="font-mono text-xs text-muted-foreground">Loading interface case file...</p>
        </div>
      </Shell>
    );
  }

  if (!data || !data.interface) {
    return (
      <Shell crumbs={["Interfaces", "Not Found"]}>
        <div className="py-20 text-center">
          <EmptyState
            title="Interface not found"
            desc="The requested interface does not exist in the active repository run."
          />
          <div className="mt-4">
            <Link to="/interfaces" className={btn({ size: "sm" })}>
              Back to Interfaces
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const iface = data.interface;
  const snap = data.latest_snapshot || {};
  const findingsList = data.findings || [];
  const explanation = data.explanation;
  const changePointsList = data.change_points || [];

  const hasAiExplanation = Boolean(
    explanation &&
    explanation.is_ai_generated &&
    (explanation.explanation_text || explanation.explanation)
  );

  const health = Math.round(snap.health_score ?? 100);
  const sev = normalizeSeverity(snap.severity, health);
  const tr = normalizeTrend(snap.trend);
  const cpHash = changePointsList[0]?.commit_hash?.slice(0, 7) || snap.change_point || null;

  // Real CK Metrics from snapshot
  const metricsList = [
    { id: "CBO", label: "Coupling Between Objects", value: snap.cbo ?? 0, hint: "Number of other classes to which this interface is coupled." },
    { id: "LCOM", label: "Lack of Cohesion", value: snap.lcom ?? 0, hint: "Henderson-Sellers LCOM*, 0 = cohesive, 1 = disjoint." },
    { id: "RFC", label: "Response For Class", value: snap.rfc ?? snap.method_count ?? 0, hint: "Number of methods that can be executed in response to a message." },
    { id: "WMC", label: "Weighted Methods", value: snap.wmc ?? snap.method_count ?? 0, hint: "Sum of cyclomatic complexity of interface methods." },
    { id: "DIT", label: "Depth of Inheritance", value: snap.dit ?? 1, hint: "Inheritance depth of the interface hierarchy." },
    { id: "NOC", label: "Number of Children", value: Math.round(snap.noc ?? 0), hint: "Direct concrete implementing classes of this interface." },
  ];

  // Implementing classes derived from findings or NOC
  const implementersList = findingsList
    .filter((f: any) => f.class_name)
    .reduce((acc: any[], curr: any) => {
      const existing = acc.find((item) => item.name === curr.class_name);
      if (existing) {
        existing.noop += curr.category === "isp_violation" ? 1 : 0;
      } else {
        acc.push({
          name: curr.class_name,
          noop: curr.category === "isp_violation" ? 1 : 0,
          total: snap.method_count || 10,
        });
      }
      return acc;
    }, []);

  const chartHistory = historyData.length > 0
    ? historyData.map((h: any) => ({
        commit: h.commit_hash || "Recent",
        health: Math.round(h.health_score ?? 100),
      }))
    : [{ commit: currentRun?.current_commit?.slice(0, 7) || "HEAD", health }];

  return (
    <Shell crumbs={["Interfaces", iface.name]}>
      <PageHeader
        eyebrow={`Case file · ${iface.package || "package"}`}
        title={iface.name}
        actions={
          <>
            <Link to="/history" className={btn({ variant: "outline", size: "sm" })}>
              <GitCompare className="size-3.5" />Compare snapshots
            </Link>
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = `/api/v1/reports/pdf?run_id=${targetRunId}`;
                link.download = `InterfaceGuard_Report_${iface.name}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className={cn(btn({ size: "sm" }), "cursor-pointer")}
            >
              <FilePlus2 className="size-3.5" />Download in PDF
            </button>
          </>
        }
      />

      <p className="mt-3 font-mono text-xs text-muted-foreground">
        {iface.file_path} · {Math.round(snap.noc ?? 0)} implementing classes · analyzed at commit {currentRun?.current_commit?.slice(0, 7) || "HEAD"}
      </p>

      <section className="mt-8 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-5">
        {[
          ["Health Score", <span key="hs" className="font-display text-3xl font-bold">{health}<span className="text-base text-muted-foreground">/100</span></span>],
          ["Severity", <SeverityBadge key="sev" s={sev} />],
          ["Trend", <TrendTag key="tr" t={tr} />],
          ["Findings", <span key="fd" className="font-display text-3xl font-bold">{findingsList.length}</span>],
          ["Change point", <span key="cp" className="font-mono text-sm text-clay">{cpHash ?? "none"}</span>],
        ].map(([k, v], n) => (
          <div key={n} className="bg-paper p-4">
            <p className="eyebrow mb-2">{k}</p>
            {v}
          </div>
        ))}
      </section>

      <section className="mt-12">
        <SectionTitle n="01" title="Metrics" />
        <div className="grid grid-cols-2 gap-y-6 md:grid-cols-6">
          {metricsList.map((m) => (
            <div key={m.id} className="border-l border-border pl-3">
              <p className="flex items-center gap-1 font-mono text-xs">
                {m.id}
                <Tip text={m.hint} />
              </p>
              <p className="font-display text-2xl font-bold">
                {typeof m.value === "number" ? (m.value % 1 === 0 ? m.value : m.value.toFixed(2)) : m.value}
              </p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 font-mono text-sm md:grid-cols-4">
          <p>Method count <span className="text-forest font-semibold">{snap.method_count ?? 0}</span></p>
          <p>Breaking changes <span className="text-clay">{snap.breaking_changes_count ?? 0}</span></p>
          <p>Code churn <span>{snap.churn_count ?? 0} edits</span></p>
          <p>Cohesion <span>{typeof snap.cohesion_score === "number" ? snap.cohesion_score.toFixed(2) : "0.50"}</span></p>
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle n="02" title="Measured evidence" />
        {findingsList.length === 0 ? (
          <p className="py-6 font-mono text-xs text-muted-foreground italic border-y border-border">
            No ISP violations or design smells detected for this interface.
          </p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {findingsList.map((f: any, idx: number) => {
              const fSev = (f.severity
                ? f.severity.charAt(0).toUpperCase() + f.severity.slice(1).toLowerCase()
                : "Medium") as Severity;
              return (
                <article key={idx} className="grid gap-3 py-4 md:grid-cols-[180px_1fr_200px]">
                  <div>
                    <SeverityBadge s={fSev} />
                    <p className="mt-2 font-semibold text-charcoal">{f.rule_name || f.category?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="text-sm">
                    {f.evidence && (
                      <p><span className="font-mono text-xs text-muted-foreground">OBSERVED </span>{f.evidence}</p>
                    )}
                    <p className="mt-1 text-muted-foreground">{f.description}</p>
                  </div>
                  <div className="font-mono text-xs">
                    <p>{f.class_name || iface.name}</p>
                    {f.method_name && <p className="text-muted-foreground">method: {f.method_name}</p>}
                    <Link to="/history" className="mt-1 inline-block text-primary hover:underline">
                      Historical evidence →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <SectionTitle n="03" title="Implementing classes" />
          {implementersList.length === 0 ? (
            <p className="py-4 font-mono text-xs text-muted-foreground italic">
              {snap.noc ? `${Math.round(snap.noc)} implementing class(es) with zero no-op stubs.` : "No direct implementors extracted."}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {implementersList.map((c: any) => (
                <li key={c.name} className="flex items-center gap-3">
                  <span className="flex-1 font-mono truncate" title={c.name}>{c.name}</span>
                  <span className="flex h-2 w-24 bg-forest/80">
                    <span className="bg-clay" style={{ width: `${Math.min(100, (c.noop / c.total) * 100)}%` }} />
                  </span>
                  <span className={cn("w-20 text-right font-mono text-xs", c.noop > 0 && "text-clay")}>
                    {c.noop} no-op
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <SectionTitle n="04" title="Health Score history" />
          <div className="relative h-56">
            <ResponsiveContainer>
              <LineChart data={chartHistory} margin={{ left: -20, right: 8 }} onClick={() => setShowCp((s) => !s)}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="commit" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} stroke="var(--charcoal)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--charcoal)" />
                {cpHash && (
                  <ReferenceLine
                    x={cpHash}
                    stroke="var(--clay)"
                    strokeDasharray="3 3"
                    label={{ value: "change point", fill: "var(--clay)", fontSize: 10, position: "top" }}
                  />
                )}
                <Line dataKey="health" stroke="var(--forest)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            {showCp && changePointsList[0] && (
              <div className="glass absolute right-2 top-2 w-64 rounded-md p-3 text-xs shadow-lg">
                <p className="font-mono text-clay">{changePointsList[0].commit_hash?.slice(0, 7)} · {changePointsList[0].commit_date}</p>
                <p className="mt-1">@{changePointsList[0].author}: {changePointsList[0].message || changePointsList[0].description}</p>
                <p className="mt-2 font-mono">Health {changePointsList[0].score_before} → {changePointsList[0].score_after}</p>
              </div>
            )}
          </div>
          {cpHash && (
            <button onClick={() => setShowCp((s) => !s)} className={btn({ variant: "quiet", size: "sm" })}>
              Inspect change point {cpHash}
            </button>
          )}
        </div>
      </section>

      <section className="mt-12 border border-dashed border-foreground/30 bg-paper/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-forest" />
            <span className="eyebrow">
              Architectural Explanation · {hasAiExplanation ? "On-Demand Analysis" : "Deferred"}
            </span>
            <span
              className={cn(
                "rounded-sm px-2 py-0.5 font-mono text-[11px]",
                hasAiExplanation
                  ? "bg-forest/15 text-forest font-semibold"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {hasAiExplanation
                ? (explanation?.provider || "Gemini Flash")
                : "0 Tokens Consumed (Preserves RPM/RPD)"}
            </span>
          </div>

          {hasAiExplanation && (
            <button
              onClick={handleGenerateAi}
              disabled={generatingAi}
              className={cn(btn({ variant: "outline", size: "sm" }), "cursor-pointer gap-2 text-xs")}
            >
              {generatingAi ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Regenerating with Gemini…
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Regenerate with Gemini
                </>
              )}
            </button>
          )}
        </div>

        {quotaNotice && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-amber/40 bg-amber/15 px-3 py-2 text-xs font-mono text-charcoal">
            <AlertTriangle className="size-4 shrink-0 text-amber" />
            <span>{quotaNotice}</span>
          </div>
        )}

        {!hasAiExplanation ? (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-forest/10 text-forest">
              <Sparkles className="size-5" />
            </div>
            <h3 className="font-semibold text-charcoal">No AI Explanation Generated Yet</h3>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              To strictly conserve Gemini API quotas (5 RPM / 20 RPD limits), architectural explanations are generated only on demand for specific interfaces.
            </p>
            <button
              onClick={handleGenerateAi}
              disabled={generatingAi}
              className={cn(btn({ variant: "primary", size: "sm" }), "mt-4 cursor-pointer gap-2 text-xs")}
            >
              {generatingAi ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Analyzing with Gemini…
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Generate with Gemini
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* 1. Root Cause Analysis */}
            <div className="rounded-md border border-border bg-paper p-5 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-clay/15 text-clay">
                  <AlertTriangle className="size-3" />
                </span>
                <h3 className="font-display text-sm font-bold tracking-tight text-charcoal">Why It May Be Eroding</h3>
              </div>
              <p className="mt-3.5 text-sm leading-relaxed text-charcoal/90">
                {explanation?.explanation_text || explanation?.explanation || "Interface contains client-specific methods that should be segregated into cohesive sub-interfaces."}
              </p>
            </div>

            {/* 2. Step-by-Step Refactoring Plan */}
            <div className="rounded-md border border-border bg-paper p-5 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-forest/15 text-forest">
                  <CheckCircle2 className="size-3" />
                </span>
                <h3 className="font-display text-sm font-bold tracking-tight text-charcoal">Step-by-Step Refactoring Plan</h3>
              </div>
              <div className="mt-3.5 space-y-2.5">
                {parseSteps(explanation?.refactoring_recommendation || explanation?.recommendation).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-sm border border-border/50 bg-cream/35 p-3.5 text-sm">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest font-mono text-[11px] font-bold text-cream">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed text-charcoal/90">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 & 4: Suggested Interface Breakdown & Risks */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Suggested Interface Breakdown */}
              <div className="rounded-md border border-border bg-paper p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <span className="flex size-5 items-center justify-center rounded-full bg-forest/15 text-forest">
                      <Layers className="size-3" />
                    </span>
                    <h3 className="font-display text-sm font-bold tracking-tight text-charcoal">Suggested Interface Breakdown</h3>
                  </div>
                  <div className="mt-3.5 space-y-3">
                    {parseBreakdown(explanation?.responsibility_separation).map((subIface, idx) => (
                      <div key={idx} className="rounded-sm border border-border/60 bg-cream/30 p-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-charcoal">
                          <span className="font-normal text-muted-foreground">interface</span>
                          <span className="text-forest font-semibold">{subIface.name}</span>
                        </div>
                        {subIface.methods.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {subIface.methods.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                className="rounded-sm border border-border/80 bg-paper px-2 py-0.5 font-mono text-[11px] text-charcoal shadow-2xs"
                              >
                                {m}{m.endsWith(')') ? '' : '()'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risks & Mitigation */}
              <div className="rounded-md border border-border bg-paper p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <span className="flex size-5 items-center justify-center rounded-full bg-clay/15 text-clay">
                      <ShieldAlert className="size-3" />
                    </span>
                    <h3 className="font-display text-sm font-bold tracking-tight text-charcoal">Risks & Migration Strategy</h3>
                  </div>

                  {(() => {
                    const parsedRisk = parseRisks(explanation?.risk_analysis);
                    return (
                      <div className="mt-3.5 space-y-3 text-sm">
                        <div className="rounded-sm border border-clay/30 bg-clay/5 p-3.5">
                          <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-clay">Potential Risk</p>
                          <p className="mt-1 leading-relaxed text-charcoal/90">{parsedRisk.risk}</p>
                        </div>
                        {parsedRisk.mitigation && (
                          <div className="rounded-sm border border-healthy/50 bg-healthy/25 p-3.5">
                            <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-forest">Mitigation Strategy</p>
                            <p className="mt-1 leading-relaxed text-charcoal/90">{parsedRisk.mitigation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}
