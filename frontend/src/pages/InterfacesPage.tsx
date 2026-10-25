import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import { btn, EmptyState, PageHeader, Shell, SeverityBadge, TrendTag } from "@/components/ig";
import { Severity, Trend, normalizeSeverity, normalizeTrend } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { fetchInterfaces } from "@/services/api";
import { InterfaceItem } from "@/types";

const sevs: Severity[] = ["Low", "Medium", "High", "Critical"];

export default function InterfacesPage() {
  const { currentRun, activeRunId, repositories } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Severity[]>([]);
  const [sort, setSort] = useState<"health" | "findings">("health");
  const [interfacesList, setInterfacesList] = useState<InterfaceItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const targetRunId = currentRun?.run_id || activeRunId || repositories[0]?.latest_run?.run_id;

  useEffect(() => {
    if (!targetRunId) {
      setLoading(false);
      setInterfacesList([]);
      setTotalCount(0);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchInterfaces(targetRunId, {
      search: q || undefined,
      severity: sel.length > 0 ? sel.map((s) => s.toLowerCase()).join(",") : undefined,
      sort_by: sort === "health" ? "health_score" : "findings_count",
      order: sort === "health" ? "asc" : "desc",
    })
      .then((res) => {
        if (isMounted) {
          setInterfacesList(res.interfaces || []);
          setTotalCount(res.total ?? (res.interfaces?.length || 0));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load interfaces:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetRunId, q, sel, sort]);

  return (
    <Shell crumbs={["Interfaces"]}>
      <PageHeader
        eyebrow={`${totalCount} interface${totalCount === 1 ? "" : "s"} analyzed`}
        title="Interfaces"
        desc="Every analyzed interface, ordered by how much it needs attention."
      />

      <div className="glass sticky top-14 z-10 -mx-2 mt-6 flex flex-wrap items-center gap-2 rounded-md p-2">
        <label className="flex items-center gap-2 rounded-sm border border-border bg-paper px-2.5 py-1.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name or package"
            className="w-52 bg-transparent text-sm outline-none"
          />
        </label>
        {sevs.map((s) => (
          <button
            key={s}
            onClick={() => setSel((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))}
            className={cn(
              "rounded-sm border px-2 py-1 font-mono text-xs cursor-pointer",
              sel.includes(s) ? "border-forest bg-forest text-cream" : "border-border bg-paper"
            )}
          >
            {s}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "health" | "findings")}
          className="rounded-sm border border-border bg-paper px-2 py-1 font-mono text-xs cursor-pointer"
        >
          <option value="health">Sort: Health ↑</option>
          <option value="findings">Sort: Findings ↓</option>
        </select>
        {(q || sel.length > 0) && (
          <button
            onClick={() => {
              setQ("");
              setSel([]);
            }}
            className={btn({ variant: "quiet", size: "sm" })}
          >
            <X className="size-3" />Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2">
          <Loader2 className="size-5 animate-spin text-forest" />
          <span className="font-mono text-xs text-muted-foreground">Loading interfaces...</span>
        </div>
      ) : interfacesList.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={!targetRunId ? "No repository analyzed." : "Nothing matches."}
            desc={
              !targetRunId
                ? "Please intake and analyze a repository to extract interfaces."
                : "No interfaces satisfy these filter conditions."
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
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-foreground/40 text-left eyebrow">
                <th className="py-2 font-normal">Interface</th>
                <th className="font-normal">Health</th>
                <th className="font-normal">Severity</th>
                <th className="font-normal">Trend</th>
                <th className="font-normal">Findings</th>
                <th className="font-normal">Methods</th>
              </tr>
            </thead>
            <tbody>
              {interfacesList.map((i) => {
                const snap = i.latest_snapshot;
                const health = Math.round(i.health_score ?? snap?.health_score ?? 100);
                const sev = normalizeSeverity(i.severity || snap?.severity, health);
                const tr = normalizeTrend(i.trend || snap?.trend);
                const findingsCount = i.findings_count ?? ((snap?.isp_violations_count || 0) + (snap?.smells_count || 0));
                const methodCount = i.method_count ?? snap?.method_count ?? 0;

                return (
                  <tr
                    key={i.interface_id}
                    tabIndex={0}
                    onClick={() => nav(`/interfaces/${i.interface_id}`)}
                    onKeyDown={(e) => e.key === "Enter" && nav(`/interfaces/${i.interface_id}`)}
                    className="cursor-pointer border-b border-border hover:bg-secondary/60 focus:bg-secondary"
                  >
                    <td className="py-3">
                      <div className="font-mono font-medium">{i.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{i.package || i.file_path}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="w-6">{health}</span>
                        <span className="h-1 w-16 bg-muted">
                          <span
                            className={cn("block h-full", health < 60 ? "bg-clay" : health < 80 ? "bg-amber" : "bg-forest")}
                            style={{ width: `${Math.min(100, Math.max(0, health))}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td><SeverityBadge s={sev} /></td>
                    <td><TrendTag t={tr} /></td>
                    <td className="font-mono">{findingsCount}</td>
                    <td className="font-mono text-xs text-muted-foreground">{methodCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Showing {interfacesList.length} of {totalCount} interfaces
          </p>
        </div>
      )}
    </Shell>
  );
}
