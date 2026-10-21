import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { submitRepository, startAnalysis, deleteRepository, fetchRepositories } from '../services/api';

type IconName =
  | 'branch'
  | 'check'
  | 'alert'
  | 'arrow'
  | 'interfaces'
  | 'history'
  | 'dependencies'
  | 'reports'
  | 'trash';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    branch: (
      <>
        <circle cx="6" cy="5" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="19" r="2" />
        <path d="M6 7v10M8 10h4a6 6 0 0 0 6-2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <path d="m12 3 10 18H2zM12 9v5M12 18h.01" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    interfaces: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    dependencies: (
      <>
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="12" cy="18" r="3" />
        <path d="m8.6 7.5 2.2 7M15.4 7.5l-2.2 7M9 6h6" />
      </>
    ),
    reports: (
      <>
        <path d="M6 2h9l4 4v16H6z" />
        <path d="M14 2v5h5M9 13h6M9 17h6M9 9h2" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Button({
  children,
  variant = 'primary',
  icon,
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet' | 'clay';
  icon?: IconName;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  );
}

export const RepositoryIntake: React.FC = () => {
  const { repositories, refreshRepositories, selectRepo, startTrackingRun } = useApp();
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('auto');
  const [historyRange, setHistoryRange] = useState('24 months');
  const [commitSampling, setCommitSampling] = useState('Fast demo (6 snapshots)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecentAudits, setShowRecentAudits] = useState(false);
  const navigate = useNavigate();

  // URL validity check (standard GitHub repo or local sample repo path)
  const valid =
    (url.includes('github.com/') && url.split('/').length >= 5) ||
    url.startsWith('sample-repositories/') ||
    url.length > 5;
  const touched = url.length > 3;

  const handleAnalyze = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || url;
    if (!targetUrl.trim()) {
      setError('Please provide a valid GitHub repository URL.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const repo = await submitRepository(targetUrl.trim(), branch, {
        erosion_threshold: 70,
      });
      await refreshRepositories();
      selectRepo(repo);

      // Fast demo: 6 snapshots (~10-15s), Standard: 12 snapshots, Deep: 25 snapshots
      let maxCommits = 6;
      if (commitSampling === 'Standard audit (12 snapshots)') maxCommits = 12;
      if (commitSampling === 'Deep analysis (25 snapshots)') maxCommits = 25;
      if (commitSampling === 'Full history (50 snapshots)') maxCommits = 50;

      const run = await startAnalysis(repo.repository_id, {
        branch,
        max_commits: maxCommits,
      });

      startTrackingRun(run.run_id);
      navigate(`/analysis?run_id=${run.run_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze repository. Ensure repository is accessible.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    // If demo repo is already analyzed, open its analysis page
    const existingDemo = repositories.find((r) => r.is_demo || r.github_url.includes('order-service'));
    if (existingDemo && existingDemo.latest_run) {
      selectRepo(existingDemo);
      navigate(`/analysis?run_id=${existingDemo.latest_run.run_id}`);
      return;
    }

    setUrl('sample-repositories/order-service');
    await handleAnalyze('sample-repositories/order-service');
  };

  const handleOpenLastAnalysis = async () => {
    setError('');
    let list = repositories;
    if (list.length === 0) {
      try {
        list = await fetchRepositories();
      } catch (err: any) {
        setError('Cannot connect to backend server. Please verify backend is running on port 5000.');
        return;
      }
    }

    const latestWithRun = list.find((r) => r.latest_run) || list[0];
    if (latestWithRun) {
      selectRepo(latestWithRun);
      if (latestWithRun.latest_run) {
        startTrackingRun(latestWithRun.latest_run.run_id);
      }
      navigate('/overview');
    } else {
      setError('No previous analysis run found. Please analyze a repository below or explore the demo.');
    }
  };

  const handleDelete = async (repoId: number) => {
    if (!window.confirm('Delete this repository and its analysis runs?')) return;
    try {
      await deleteRepository(repoId);
      await refreshRepositories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <main className="intake-page">
      {/* Editorial Navbar matching exact design */}
      <header className="intake-header" style={{ justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              display: 'grid',
              placeItems: 'center',
              border: '1px solid rgba(46, 64, 54, 0.45)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--charcoal)',
              background: 'transparent',
              lineHeight: 1,
            }}
          >
            I/
          </span>
          <span
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--charcoal)',
            }}
          >
            InterfaceGuard
          </span>
        </Link>

        <button
          type="button"
          onClick={handleOpenLastAnalysis}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '12px',
            color: 'var(--charcoal)',
          }}
          className="hover:underline"
        >
          <span>Open last analysis</span>
          <span style={{ fontSize: '13px' }}>&rarr;</span>
        </button>
      </header>

      {/* Exact Figma Hero Section */}
      <section className="intake-hero">
        <div className="intake-copy">
          <div className="eyebrow">JAVA ARCHITECTURE AUDIT</div>
          <h1>
            Find where your interfaces
            <br />
            begin to <em>break down.</em>
          </h1>
          <p className="lede">
            InterfaceGuard examines object-oriented design signals and Git
            history to show when an interface started eroding—and the evidence
            behind it.
          </p>

          <form
            className="repo-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) handleAnalyze();
            }}
          >
            <label htmlFor="repo-url">GitHub repository URL</label>
            <div className={`input-combo ${touched && !valid ? 'invalid' : ''}`}>
              <Icon name="branch" />
              <input
                id="repo-url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                }}
                placeholder="https://github.com/organization/repository"
              />
              {valid && (
                <span className="valid-check">
                  <Icon name="check" size={16} />
                </span>
              )}
            </div>

            {touched && !valid && (
              <div className="field-error">
                <Icon name="alert" size={14} /> Enter a complete GitHub repository URL.
              </div>
            )}

            {error && (
              <div className="field-error" style={{ marginTop: '8px' }}>
                <Icon name="alert" size={14} /> {error}
              </div>
            )}

            <div className="scope-row">
              <label>
                <span>Branch</span>
                <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="auto">auto (default branch)</option>
                  <option value="main">main</option>
                  <option value="master">master</option>
                  <option value="develop">develop</option>
                </select>
              </label>
              <label>
                <span>History range</span>
                <select value={historyRange} onChange={(e) => setHistoryRange(e.target.value)}>
                  <option value="24 months">24 months</option>
                  <option value="12 months">12 months</option>
                  <option value="All history">All history</option>
                </select>
              </label>
              <label>
                <span>Commit sampling</span>
                <select value={commitSampling} onChange={(e) => setCommitSampling(e.target.value)}>
                  <option value="Fast demo (6 snapshots)">Fast demo (6 snapshots)</option>
                  <option value="Standard audit (12 snapshots)">Standard audit (12 snapshots)</option>
                  <option value="Deep analysis (25 snapshots)">Deep analysis (25 snapshots)</option>
                  <option value="Full history (50 snapshots)">Full history (50 snapshots)</option>
                </select>
              </label>
            </div>

            <div className="form-actions">
              <Button type="submit" disabled={!valid || loading} icon="arrow">
                {loading ? 'Analyzing repository...' : 'Analyze repository'}
              </Button>
              <Button variant="secondary" onClick={handleDemo} disabled={loading}>
                Explore demo repository
              </Button>
            </div>
          </form>
        </div>

        {/* Exact Figma Structure Preview / Technical Motif */}
        <div
          className="technical-motif"
          aria-label="Abstract Java dependency structure"
        >
          <div className="motif-caption mono">STRUCTURE PREVIEW / JAVA</div>
          <div className="code-node node-a">
            <span className="node-type">interface</span>
            <b>PaymentProcessor</b>
            <code>+ authorize(Order)</code>
            <code>+ capture(Payment)</code>
            <code>+ refund(Transaction)</code>
          </div>
          <div className="code-node node-b">
            <span className="node-type">implements</span>
            <b>StripeProcessor</b>
            <code>CBO 12 · RFC 34</code>
          </div>
          <div className="code-node node-c warning">
            <span className="node-type">change point</span>
            <b>8f2c91a</b>
            <code>+ 6 responsibilities</code>
          </div>
          <svg className="motif-lines" viewBox="0 0 500 480">
            <path d="M80 145 C190 145 160 265 290 265M220 145 C350 145 330 365 400 365" />
            <circle cx="220" cy="145" r="4" />
            <circle cx="290" cy="265" r="4" />
          </svg>
          <div className="motif-note">
            <span>Observed pattern</span>
            <strong>
              Interface responsibility expanded 3.2× after payment orchestration
              was introduced.
            </strong>
          </div>
        </div>
      </section>

      {/* Modal Overlay for Recent Audits (Zero in-flow space taken) */}
      {showRecentAudits && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26,26,26,0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowRecentAudits(false)}
        >
          <div
            style={{
              background: 'var(--cream)',
              border: '1px solid var(--charcoal)',
              boxShadow: '6px 6px 0 rgba(46,64,54,0.2)',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '22px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '8px',
              }}
            >
              <span className="mono" style={{ fontWeight: 600, fontSize: '12px', color: 'var(--forest)' }}>
                PREVIOUSLY ANALYZED REPOSITORIES ({repositories.length})
              </span>
              <button
                type="button"
                onClick={() => setShowRecentAudits(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: 'var(--muted)',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {repositories.map((repo) => (
                <div
                  key={repo.repository_id}
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>
                    <strong style={{ display: 'block', color: 'var(--charcoal)', fontSize: '13px' }}>{repo.name}</strong>
                    <span className="mono muted" style={{ fontSize: '10.5px' }}>{repo.github_url}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        selectRepo(repo);
                        navigate('/overview');
                      }}
                      className="btn btn-primary"
                      style={{ height: '30px', minHeight: '30px', padding: '0 10px', fontSize: '11px' }}
                    >
                      Open &rarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(repo.repository_id)}
                      style={{
                        background: 'transparent',
                        color: 'var(--muted)',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                      }}
                      title="Delete"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exact Figma Footer */}
      <footer className="intake-footer">
        <span>
          <Icon name="interfaces" size={15} /> Interface design &amp; ISP violations
        </span>
        <span>
          <Icon name="history" size={15} /> Git change-point detection
        </span>
        <span>
          <Icon name="dependencies" size={15} /> Dependency cycles
        </span>
        <span>
          <Icon name="reports" size={15} /> Evidence-based PDF report
        </span>
      </footer>
    </main>
  );
};
