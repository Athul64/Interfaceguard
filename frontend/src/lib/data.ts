export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Trend = "Stable" | "Rising" | "Accelerating" | "Insufficient";

export function normalizeSeverity(sev?: string | null, healthScore?: number | null): Severity {
  if (sev) {
    const s = String(sev).toLowerCase().trim();
    if (s === "critical") return "Critical";
    if (s === "high") return "High";
    if (s === "warning" || s === "medium") return "Medium";
    if (s === "healthy" || s === "low") return "Low";
  }
  if (typeof healthScore === "number" && !isNaN(healthScore)) {
    if (healthScore < 40) return "Critical";
    if (healthScore < 60) return "High";
    if (healthScore < 80) return "Medium";
    return "Low";
  }
  return "Low";
}

export function normalizeTrend(tr?: string | null): Trend {
  if (tr) {
    const s = String(tr).toLowerCase().trim();
    if (s === "accelerating") return "Accelerating";
    if (s === "rising") return "Rising";
    if (s === "insufficient") return "Insufficient";
    return "Stable";
  }
  return "Stable";
}

export interface Iface {
  id: string;
  name: string;
  pkg: string;
  path: string;
  health: number;
  severity: Severity;
  trend: Trend;
  findings: number;
  changePoint?: string;
  impls: number;
  methods: number;
}

export const stages = [
  "Repository acquisition",
  "Git-history discovery",
  "Java parsing",
  "Interface extraction",
  "Metric computation",
  "Design smell detection",
  "Dependency analysis",
  "Trend & change-point detection",
  "AI explanation generation",
  "Results persistence",
];

// Fallback empty structures for safety
export const repo = {
  name: "",
  branch: "",
  commit: "",
  analyzedAt: "",
  commits: 0,
  erosionIndex: 0,
  prevIndex: 0,
};

export const interfaces: Iface[] = [];
export const history: { commit: string; date: string; health: number; index: number; cp?: boolean }[] = [];
export const changePoint = {
  commit: "",
  date: "",
  author: "",
  message: "",
  before: 0,
  after: 0,
  deltas: [] as { metric: string; before: number; after: number }[],
};
export const metrics: { id: string; label: string; value: number; hint: string }[] = [];
export const findings: { type: string; severity: Severity; observed: string; rule: string; target: string; loc: string; text: string }[] = [];
export const implementers: { name: string; noop: number; total: number }[] = [];
export const nodes: { id: string; pkg: string; x: number; y: number; kind: "interface" | "class"; cycle?: boolean }[] = [];
export const edges: [string, string, boolean?][] = [];
