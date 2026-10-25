import React, { useState } from "react";
import { btn, PageHeader, SectionTitle, Shell } from "@/components/ig";
import { useApp } from "@/context/AppContext";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 py-3 md:grid-cols-[220px_1fr] md:items-center">
      <span className="text-sm">{label}</span>
      {children}
    </label>
  );
}

const input = "h-9 rounded-sm border border-input bg-paper px-3 font-mono text-sm";

export default function SettingsPage() {
  const { repositories, currentRepo, refreshRepositories } = useApp();
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleDeleteHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all analysis history and repositories?")) return;
    setClearing(true);
    try {
      for (const repo of repositories) {
        await fetch(`/api/v1/repositories/${repo.repository_id}`, { method: "DELETE" }).catch(() => null);
      }
      await refreshRepositories();
      setCleared(true);
    } catch (err) {
      console.error("Failed to delete history:", err);
    } finally {
      setClearing(false);
    }
  };

  const defaultBranch = currentRepo?.default_branch || "main";

  return (
    <Shell crumbs={["Settings"]}>
      <PageHeader eyebrow="Workspace" title="Settings" />
      <section className="mt-8 max-w-3xl">
        <SectionTitle n="01" title="Analysis defaults" />
        <Field label="Default branch">
          <input className={input} defaultValue={defaultBranch} />
        </Field>
        <Field label="Commit sampling">
          <select className={input} defaultValue="Every 10th commit">
            <option>Every 10th commit</option>
            <option>All commits</option>
            <option>Tagged releases</option>
          </select>
        </Field>
        <Field label="History range">
          <select className={input} defaultValue="24 months">
            <option>24 months</option>
            <option>12 months</option>
            <option>All</option>
          </select>
        </Field>
      </section>

      <section className="mt-10 max-w-3xl">
        <SectionTitle n="02" title="LLM provider" />
        <p className="font-mono text-sm">
          <span className="text-forest">●</span> Configured · key stored server-side, never shown
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          To change the key, set <code className="font-mono">IG_LLM_API_KEY</code> in your server environment and restart the analyzer.
        </p>
      </section>

      <section className="mt-10 max-w-3xl">
        <SectionTitle n="03" title="Data & retention" />
        <p className="text-sm text-muted-foreground">
          {repositories.length > 0
            ? `${repositories.length} repository profile(s) currently stored locally.`
            : "No analysis runs currently stored."}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleDeleteHistory}
            disabled={clearing || repositories.length === 0}
            className={btn({ variant: "destructive", size: "sm" })}
          >
            {clearing ? "Clearing..." : "Delete analysis history"}
          </button>
          {cleared && (
            <span className="font-mono text-xs text-forest">Analysis history cleared.</span>
          )}
        </div>
      </section>
    </Shell>
  );
}
