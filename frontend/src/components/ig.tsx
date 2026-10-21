import { Link, useLocation } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, FileText, GitBranch, History, LayoutGrid,
  Menu, Minus, Network, Search, Settings, TrendingUp, X, CircleDashed, Info,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { repo, type Severity, type Trend, normalizeSeverity, normalizeTrend } from "@/lib/data";

export const btn = cva(
  "inline-flex items-center justify-center gap-2 font-display text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none rounded-sm focus-visible:outline-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-foreground/30 bg-transparent hover:bg-secondary",
        quiet: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-clay text-cream hover:bg-clay/90",
      },
      size: { md: "h-10 px-4", sm: "h-8 px-3 text-xs", lg: "h-12 px-6" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
export type BtnProps = VariantProps<typeof btn>;

const sevStyle: Record<Severity, string> = {
  Low: "bg-healthy text-forest border-forest/20",
  Medium: "bg-amber/20 text-charcoal border-amber/60",
  High: "bg-clay/15 text-clay border-clay/40",
  Critical: "bg-clay text-cream border-clay",
};
export function SeverityBadge({ s }: { s: Severity | string }) {
  const norm = normalizeSeverity(s);
  return (
    <span className={cn("inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide rounded-sm", sevStyle[norm])}>
      {(norm === "High" || norm === "Critical") && <AlertTriangle className="size-3" />}
      {norm}
    </span>
  );
}

export function TrendTag({ t }: { t: Trend | string }) {
  const norm = normalizeTrend(t);
  const map = {
    Stable: { icon: Minus, cls: "text-forest" },
    Rising: { icon: ArrowUpRight, cls: "text-clay" },
    Accelerating: { icon: TrendingUp, cls: "text-clay font-semibold" },
    Insufficient: { icon: CircleDashed, cls: "text-muted-foreground" },
  }[norm];
  const I = map.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-xs", map.cls)}>
      <I className="size-3.5" /> {norm === "Insufficient" ? "Insufficient history" : norm}
    </span>
  );
}

export function Tip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info className="size-3.5 text-muted-foreground" aria-label={text} />
      <span className="glass pointer-events-none absolute left-1/2 top-5 z-30 hidden w-60 -translate-x-1/2 rounded-md p-2.5 text-xs leading-relaxed text-foreground shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}

export function PageHeader({ eyebrow, title, accent, desc, actions }: { eyebrow: string; title: string; accent?: string; desc?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          {title} {accent && <span className="accent-serif font-normal text-clay">{accent}</span>}
        </h1>
        {desc && <p className="mt-2 text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

const nav = [
  { to: "/overview", label: "Overview", icon: LayoutGrid },
  { to: "/interfaces", label: "Interfaces", icon: FileText },
  { to: "/dependencies", label: "Dependencies", icon: Network },
  { to: "/history", label: "History", icon: History },
  { to: "/reports", label: "Reports", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNav }: { onNav?: () => void }) {
  const location = useLocation();
  const path = location.pathname;
  return (
    <nav className="flex flex-col gap-0.5">
      {nav.map((n) => {
        const active = path.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-white",
              active ? "bg-white/10 font-medium" : "font-normal"
            )}
          >
            <n.icon className="size-4 shrink-0 text-white" />
            <span>{n.label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#CC5833]" />}
          </Link>
        );
      })}
    </nav>
  );
}

import { useApp } from "@/context/AppContext";

function RepoContext() {
  const { currentRepo, currentRun } = useApp();

  if (!currentRepo) {
    return (
      <div className="border-t border-white/20 pt-4 font-mono text-[11px] text-white">
        <p className="tracking-widest text-white/60">REPOSITORY</p>
        <p className="mt-1 text-white/80 italic">None selected</p>
        <Link to="/" className="mt-2 inline-flex items-center gap-1 text-white underline text-xs">
          + Intake repository
        </Link>
      </div>
    );
  }

  const isCompleted = currentRun?.status === "completed";
  const commitHash = currentRun?.current_commit ? currentRun.current_commit.slice(0, 7) : (currentRepo.default_branch || "main");

  return (
    <div className="border-t border-white/20 pt-4 font-mono text-[11px] text-white">
      <p className="tracking-widest text-white/60">REPOSITORY</p>
      <p className="mt-1 font-medium truncate text-white" title={currentRepo.name}>{currentRepo.name}</p>
      <p className="mt-1 flex items-center gap-1 truncate text-white"><GitBranch className="size-3 shrink-0 text-white" /> {currentRepo.default_branch || "main"} · {commitHash}</p>
      <p className="mt-3 flex items-center gap-1.5 text-white">
        <span className={cn("size-1.5 rounded-full shrink-0", isCompleted ? "bg-healthy" : "bg-amber animate-pulse")} />
        {isCompleted ? "Analysis completed" : currentRun?.status === "running" ? "Analyzing..." : "Ready"}
      </p>
    </div>
  );
}

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-white">
      <span className="grid size-6 place-items-center border border-white font-mono text-[10px] text-white">I/</span>
      InterfaceGuard
    </Link>
  );
}

export function Shell({ children, crumbs }: { children: ReactNode; crumbs?: string[] }) {
  const [open, setOpen] = useState(false);
  const { currentRepo } = useApp();

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between bg-forest p-5 md:flex">
        <div className="space-y-8"><Wordmark /><NavList /></div>
        <RepoContext />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex w-72 flex-col justify-between bg-forest p-5">
            <div className="space-y-8">
              <div className="flex items-center justify-between"><Wordmark />
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-cream"><X className="size-5" /></button>
              </div>
              <NavList onNav={() => setOpen(false)} />
            </div>
            <RepoContext />
          </div>
          <div className="flex-1 bg-charcoal/40" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="glass sticky top-0 z-20 flex h-14 items-center gap-3 border-x-0 border-t-0 px-4 md:px-8">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <div className="flex min-w-0 items-center gap-2 font-mono text-xs">
            <span className="truncate font-semibold">{currentRepo ? currentRepo.name : "InterfaceGuard"}</span>
            {currentRepo && (
              <span className="hidden items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-muted-foreground sm:inline-flex">
                <GitBranch className="size-3" />{currentRepo.default_branch || "main"}
              </span>
            )}
            {crumbs?.map((c) => <span key={c} className="hidden text-muted-foreground lg:inline">/ {c}</span>)}
          </div>
          <label className="ml-auto hidden items-center gap-2 rounded-sm border border-border bg-paper/70 px-2.5 py-1.5 sm:flex">
            <Search className="size-3.5 text-muted-foreground" />
            <input placeholder="Search types, commits…" className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <kbd className="font-mono text-[10px] text-muted-foreground">⌘K</kbd>
          </label>
        </div>
        <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}

export function SectionTitle({ n, title, link }: { n: string; title: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
      <h2 className="flex items-baseline gap-3 text-base font-semibold"><span className="font-mono text-xs text-clay">{n}</span>{title}</h2>
      {link && <Link to={link.to} className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">{link.label}<ArrowRight className="size-3" /></Link>}
    </div>
  );
}

export function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-dashed border-border px-6 py-12 text-center">
      <p className="accent-serif text-3xl text-forest">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
