import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Maximize, Minus, Plus, RotateCcw, Search, Loader2 } from "lucide-react";
import { btn, EmptyState, PageHeader, Shell } from "@/components/ig";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { fetchDependencies } from "@/services/api";

const slug = (n: string) => n.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

export default function DependenciesPage() {
  const { currentRun, activeRunId, repositories } = useApp();
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<[string, string, boolean][]>([]);
  const [loading, setLoading] = useState(true);

  const [sel, setSel] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [cyclesOnly, setCyclesOnly] = useState(false);
  const [q, setQ] = useState("");

  const targetRunId = currentRun?.run_id || activeRunId || repositories[0]?.latest_run?.run_id;

  useEffect(() => {
    if (!targetRunId) {
      setLoading(false);
      setNodes([]);
      setEdges([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchDependencies(targetRunId)
      .then((res) => {
        if (!isMounted) return;

        const rawNodes = res.nodes || [];
        const rawEdges = res.edges || [];

        const totalNodes = rawNodes.length;
        const centerX = 500;
        const centerY = 300;
        const radius = Math.max(120, Math.min(240, 60 + totalNodes * 18));

        const computedNodes = rawNodes.map((n: any, idx: number) => {
          const angle = (idx / (totalNodes || 1)) * 2 * Math.PI - Math.PI / 2;
          return {
            id: n.id || n.label,
            label: n.label || n.id,
            kind: (n.type?.toLowerCase() === "class" ? "class" : "interface") as "class" | "interface",
            cycle: Boolean(n.in_cycle),
            x: Math.round(centerX + radius * Math.cos(angle)),
            y: Math.round(centerY + radius * Math.sin(angle)),
            pkg: n.package || "package",
          };
        });

        const computedEdges: [string, string, boolean][] = rawEdges.map((e: any) => [
          e.source_name,
          e.target_name,
          Boolean(e.in_cycle),
        ]);

        setNodes(computedNodes);
        setEdges(computedEdges);
        if (computedNodes.length > 0 && !sel) {
          setSel(computedNodes[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dependency graph:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetRunId]);

  const near = new Set(edges.filter((e) => e[0] === sel || e[1] === sel).flatMap((e) => [e[0], e[1]]));
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const node = nodes.find((n) => n.id === sel);
  const shown = nodes.filter((n) => (!cyclesOnly || n.cycle) && n.id.toLowerCase().includes(q.toLowerCase()));
  const ids = new Set(shown.map((n) => n.id));
  const cycleCount = edges.filter((e) => e[2]).length;

  return (
    <Shell crumbs={["Dependencies"]}>
      <PageHeader
        eyebrow={`${nodes.length} types · ${cycleCount} cycle edge${cycleCount === 1 ? "" : "s"} detected`}
        title="Dependency graph"
        accent="where coupling hides."
      />

      {loading ? (
        <div className="flex h-96 items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-forest" />
          <p className="font-mono text-xs text-muted-foreground">Constructing type dependency graph...</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={!targetRunId ? "No repository analyzed." : "No dependencies discovered."}
            desc={
              !targetRunId
                ? "Please intake and analyze a repository to extract class and interface relationships."
                : "No inter-type dependency edges were detected in this analysis."
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
          <div className="relative mt-6 grid-canvas h-[560px] overflow-hidden border border-border bg-paper">
            <div className="glass absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2 rounded-md p-2 text-xs">
              <label className="flex items-center gap-1.5 rounded-sm border border-border bg-paper px-2 py-1">
                <Search className="size-3" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Find type"
                  className="w-28 bg-transparent outline-none"
                />
              </label>
              <label className="flex items-center gap-1 font-mono cursor-pointer">
                <input
                  type="checkbox"
                  checked={cyclesOnly}
                  onChange={(e) => setCyclesOnly(e.target.checked)}
                />
                Cycles only
              </label>
              {[
                [Plus, () => setZoom((z) => z + 0.1), "Zoom in"],
                [Minus, () => setZoom((z) => Math.max(0.5, z - 0.1)), "Zoom out"],
                [Maximize, () => setZoom(1), "Fit"],
                [RotateCcw, () => { setZoom(1); setSel(null); }, "Reset"],
              ].map(([I, fn, l], k) => {
                const Icon = I as typeof Plus;
                return (
                  <button
                    key={k}
                    onClick={fn as () => void}
                    aria-label={l as string}
                    className="grid size-7 place-items-center rounded-sm border border-border bg-paper hover:bg-secondary cursor-pointer"
                  >
                    <Icon className="size-3.5" />
                  </button>
                );
              })}
            </div>

            <svg
              viewBox="0 0 1000 600"
              className="h-full w-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            >
              <defs>
                <marker id="ar" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0 0L10 5L0 10z" fill="var(--charcoal)" />
                </marker>
                <marker id="arc" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0 0L10 5L0 10z" fill="var(--clay)" />
                </marker>
              </defs>

              {edges
                .filter(([a, b]) => ids.has(a) && ids.has(b) && pos[a] && pos[b])
                .map(([a, b, c], i) => {
                  const A = pos[a]!;
                  const B = pos[b]!;
                  const hi = sel && (a === sel || b === sel);
                  return (
                    <line
                      key={`${a}-${b}-${i}`}
                      x1={A.x}
                      y1={A.y}
                      x2={B.x}
                      y2={B.y}
                      stroke={c ? "var(--clay)" : "var(--charcoal)"}
                      strokeOpacity={hi || c ? 0.9 : 0.25}
                      strokeWidth={hi ? 1.8 : 1}
                      markerEnd={`url(#${c ? "arc" : "ar"})`}
                    />
                  );
                })}

              {shown.map((n) => {
                const active = n.id === sel;
                const dim = sel && !near.has(n.id) && !active;
                const w = Math.max(70, n.id.length * 7.5 + 24);
                return (
                  <g key={n.id} onClick={() => setSel(n.id)} className="cursor-pointer" opacity={dim ? 0.35 : 1}>
                    <rect
                      x={n.x - w / 2}
                      y={n.y - 16}
                      width={w}
                      height={32}
                      rx={3}
                      fill={active ? "var(--forest)" : "var(--paper)"}
                      stroke={n.cycle ? "var(--clay)" : "var(--charcoal)"}
                      strokeWidth={n.cycle ? 1.6 : 0.8}
                      strokeDasharray={n.kind === "interface" ? "" : "3 2"}
                    />
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      fontFamily="IBM Plex Mono"
                      fontSize="12"
                      fill={active ? "var(--cream)" : "var(--charcoal)"}
                    >
                      {n.id}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="glass absolute bottom-3 left-3 rounded-md p-2 font-mono text-[11px]">
              <p>▭ interface &nbsp; ⬚ class &nbsp; <span className="text-clay">— cycle edge</span></p>
            </div>

            {node && (
              <aside className="glass absolute right-3 top-3 w-64 rounded-md p-4 text-sm shadow-lg max-h-[500px] overflow-y-auto">
                <p className="eyebrow">{node.kind} · {node.pkg}</p>
                <p className="mt-1 font-mono font-semibold break-all">{node.id}</p>
                <p className="mt-3 font-mono text-xs">
                  Dependencies: {edges.filter((e) => e[0] === node.id).length} out · {edges.filter((e) => e[1] === node.id).length} in
                </p>
                {node.cycle && (
                  <p className="mt-2 text-xs text-clay">⚠ Participates in circular dependency</p>
                )}
                <p className="mt-3 eyebrow">Related</p>
                <ul className="font-mono text-xs space-y-0.5">
                  {[...near].filter((x) => x !== node.id).slice(0, 10).map((x) => (
                    <li key={x} className="truncate">{x}</li>
                  ))}
                  {[...near].filter((x) => x !== node.id).length === 0 && (
                    <li className="text-muted-foreground italic">None</li>
                  )}
                </ul>
                {node.kind === "interface" && (
                  <Link
                    to={`/interfaces/${node.id}`}
                    className="mt-4 inline-block font-mono text-xs text-forest hover:underline"
                  >
                    View interface case file →
                  </Link>
                )}
              </aside>
            )}
          </div>

          <details className="mt-6 text-sm">
            <summary className="cursor-pointer font-mono text-xs text-muted-foreground hover:text-charcoal">
              Relationship list ({edges.length} connections)
            </summary>
            <ul className="mt-3 space-y-1 font-mono text-xs max-h-48 overflow-y-auto">
              {edges.map(([a, b, c], i) => (
                <li key={`${a}-${b}-${i}`} className={cn(c && "text-clay")}>
                  {a} → {b}{c && " (cycle)"}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </Shell>
  );
}
